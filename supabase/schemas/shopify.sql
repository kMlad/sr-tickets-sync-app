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
