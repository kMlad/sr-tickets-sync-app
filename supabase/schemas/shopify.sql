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
  is_current boolean not null default false,
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

create table public.event_pass_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  shop text not null,
  name text not null,
  category text not null default 'free' check (category in ('free', 'paid')),
  created_at timestamptz not null default now(),
  foreign key (event_id, shop) references public.events (id, shop) on delete cascade,
  unique (event_id, name)
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
  manage_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
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
  order_id uuid references public.shopify_orders (id) on delete cascade,
  buyer_id uuid references public.buyers (id) on delete set null,
  pass_type_id uuid references public.event_pass_types (id) on delete set null,
  source text not null default 'shopify' check (source in ('shopify', 'admin')),
  shopify_product_id text,
  shopify_line_item_id text,
  shopify_line_item_position integer,
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
  ),
  constraint ticket_instances_shopify_fields_required check (
    source <> 'shopify'
    or (
      order_id is not null
      and shopify_product_id is not null
      and shopify_line_item_id is not null
      and shopify_line_item_position is not null
    )
  )
);

create table public.attendees (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.ticket_instances (id) on delete cascade,
  shop text not null references public.shopify_installations (shop) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  order_id uuid references public.shopify_orders (id) on delete cascade,
  buyer_id uuid references public.buyers (id) on delete set null,
  pass_type_id uuid references public.event_pass_types (id) on delete set null,
  source text not null default 'shopify' check (source in ('shopify', 'admin')),
  name text not null,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  attendee_type text not null default 'attendee' check (attendee_type in ('attendee')),
  affiliation text,
  title text,
  badge_type text,
  added_in_agorify boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  confirmation_sent_at timestamptz,
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index events_shop_starts_at_idx
  on public.events (shop, starts_at);

create unique index events_current_event_key
  on public.events (shop)
  where is_current;

create index event_ticket_products_event_id_idx
  on public.event_ticket_products (event_id);

create index event_pass_types_event_id_idx
  on public.event_pass_types (event_id);

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

create unique index attendees_admin_event_email_key
  on public.attendees (event_id, email)
  where source = 'admin';

alter table public.events enable row level security;
alter table public.event_ticket_products enable row level security;
alter table public.event_pass_types enable row level security;
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

create or replace function public.set_current_event(
  p_shop text,
  p_event_id uuid
)
returns void
language plpgsql
as $$
begin
  -- Clear first, then set. A single `set is_current = (id = p_event_id)` statement
  -- trips events_current_event_key, because the partial unique index is checked
  -- per row and cannot be deferred.
  update public.events
  set is_current = false
  where shop = p_shop
    and is_current
    and id <> p_event_id;

  update public.events
  set is_current = true
  where shop = p_shop
    and id = p_event_id
    and not is_current;
end;
$$;

create or replace function public.create_free_pass_attendee(
  p_shop text,
  p_event_id uuid,
  p_pass_type_id uuid,
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
  v_pass_type public.event_pass_types%rowtype;
  v_email text := lower(trim(p_email));
  v_ticket_id uuid;
  v_attendee_id uuid;
begin
  select *
  into v_pass_type
  from public.event_pass_types
  where id = p_pass_type_id
    and event_id = p_event_id
    and shop = p_shop;

  if not found then
    raise exception 'pass_type_not_found';
  end if;

  if exists (
    select 1
    from public.attendees
    where event_id = p_event_id
      and email = v_email
  ) then
    raise exception 'attendee_email_exists';
  end if;

  insert into public.ticket_instances (
    shop,
    event_id,
    pass_type_id,
    source,
    product_title,
    claim_token,
    status,
    claimed_at
  )
  values (
    p_shop,
    p_event_id,
    v_pass_type.id,
    'admin',
    v_pass_type.name,
    p_claim_token,
    'assigned',
    now()
  )
  returning id into v_ticket_id;

  insert into public.attendees (
    ticket_id,
    shop,
    event_id,
    pass_type_id,
    source,
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
    v_ticket_id,
    p_shop,
    p_event_id,
    v_pass_type.id,
    'admin',
    concat_ws(' ', trim(p_first_name), trim(p_last_name)),
    trim(p_first_name),
    trim(p_last_name),
    v_email,
    'attendee',
    trim(p_affiliation),
    trim(p_title),
    v_pass_type.name,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_attendee_id;

  return v_attendee_id;
end;
$$;

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
grant all privileges on tables to service_role;

alter default privileges in schema public
grant all privileges on sequences to service_role;

alter default privileges in schema public
grant execute on functions to service_role;
