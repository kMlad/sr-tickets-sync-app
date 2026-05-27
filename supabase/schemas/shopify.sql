create table public.shopify_installations (
  id text primary key,
  shop text not null unique,
  scope text,
  encrypted_access_token text,
  encrypted_refresh_token text,
  expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'uninstalled')),
  shopify_shop_id text,
  shop_name text,
  installed_at timestamptz not null default now(),
  uninstalled_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shopify_webhook_events (
  webhook_id text primary key,
  shop text not null,
  topic text not null,
  received_at timestamptz not null default now()
);

create index shopify_webhook_events_shop_topic_idx
  on public.shopify_webhook_events (shop, topic);

alter table public.shopify_installations enable row level security;
alter table public.shopify_webhook_events enable row level security;

create trigger shopify_installations_set_updated_at
before update on public.shopify_installations
for each row
execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  shop text not null references public.shopify_installations (shop) on delete cascade,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, shop)
);

create table public.event_ticket_products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  shop text not null,
  shopify_product_id text not null,
  product_title text,
  created_at timestamptz not null default now(),
  foreign key (event_id, shop) references public.events (id, shop) on delete cascade,
  unique (shop, shopify_product_id)
);

create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  shop text not null references public.shopify_installations (shop) on delete cascade,
  shopify_customer_id text,
  email text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop, shopify_customer_id)
);

create table public.shopify_orders (
  id uuid primary key default gen_random_uuid(),
  shop text not null references public.shopify_installations (shop) on delete cascade,
  shopify_order_id text not null,
  shopify_order_name text,
  order_number text,
  buyer_id uuid references public.buyers (id) on delete set null,
  manage_token text not null default encode(gen_random_bytes(32), 'hex'),
  buyer_notification_sent_at timestamptz,
  currency_code text,
  total_price numeric,
  ordered_at timestamptz,
  source_payload jsonb not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop, shopify_order_id)
);

create table public.ticket_instances (
  id uuid primary key default gen_random_uuid(),
  shop text not null references public.shopify_installations (shop) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  order_id uuid not null references public.shopify_orders (id) on delete cascade,
  buyer_id uuid references public.buyers (id) on delete set null,
  shopify_product_id text not null,
  shopify_line_item_id text not null,
  shopify_line_item_position integer not null,
  product_title text,
  price numeric,
  currency_code text,
  claim_token text not null unique,
  invitation_email text,
  invitation_sent_at timestamptz,
  status text not null default 'unassigned' check (status in ('unassigned', 'assigned', 'cancelled')),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_instances_line_item_instance_key unique (
    shop,
    shopify_line_item_id,
    shopify_line_item_position
  )
);

create table public.attendees (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.ticket_instances (id) on delete cascade,
  shop text not null references public.shopify_installations (shop) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  order_id uuid not null references public.shopify_orders (id) on delete cascade,
  buyer_id uuid references public.buyers (id) on delete set null,
  name text not null,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  attendee_type text not null default 'attendee' check (attendee_type in ('attendee')),
  affiliation text,
  title text,
  badge_type text,
  metadata jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index events_shop_starts_at_idx
  on public.events (shop, starts_at);

create index event_ticket_products_event_id_idx
  on public.event_ticket_products (event_id);

create index buyers_shop_email_idx
  on public.buyers (shop, email);

create index shopify_orders_shop_ordered_at_idx
  on public.shopify_orders (shop, ordered_at);

create unique index shopify_orders_manage_token_key
  on public.shopify_orders (manage_token);

create index ticket_instances_event_status_idx
  on public.ticket_instances (event_id, status);

create index ticket_instances_order_id_idx
  on public.ticket_instances (order_id);

create index attendees_event_id_idx
  on public.attendees (event_id);

alter table public.events enable row level security;
alter table public.event_ticket_products enable row level security;
alter table public.buyers enable row level security;
alter table public.shopify_orders enable row level security;
alter table public.ticket_instances enable row level security;
alter table public.attendees enable row level security;

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create trigger buyers_set_updated_at
before update on public.buyers
for each row
execute function public.set_updated_at();

create trigger shopify_orders_set_updated_at
before update on public.shopify_orders
for each row
execute function public.set_updated_at();

create trigger ticket_instances_set_updated_at
before update on public.ticket_instances
for each row
execute function public.set_updated_at();

create or replace function public.claim_ticket(
  p_claim_token text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_affiliation text,
  p_title text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_ticket public.ticket_instances%rowtype;
  v_attendee_id uuid;
begin
  select *
  into v_ticket
  from public.ticket_instances
  where claim_token = p_claim_token
  for update;

  if not found then
    raise exception 'ticket_not_found';
  end if;

  if v_ticket.status <> 'unassigned' then
    raise exception 'ticket_already_claimed';
  end if;

  insert into public.attendees (
    ticket_id,
    shop,
    event_id,
    order_id,
    buyer_id,
    name,
    first_name,
    last_name,
    email,
    attendee_type,
    affiliation,
    title,
    badge_type,
    metadata
  )
  values (
    v_ticket.id,
    v_ticket.shop,
    v_ticket.event_id,
    v_ticket.order_id,
    v_ticket.buyer_id,
    concat_ws(' ', trim(p_first_name), trim(p_last_name)),
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    'attendee',
    trim(p_affiliation),
    trim(p_title),
    v_ticket.product_title,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_attendee_id;

  update public.ticket_instances
  set status = 'assigned',
      claimed_at = now()
  where id = v_ticket.id;

  return v_attendee_id;
end;
$$;
