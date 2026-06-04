create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.shopify_orders
add column if not exists manage_token text,
add column if not exists buyer_notification_sent_at timestamptz;

update public.shopify_orders
set manage_token = encode(extensions.gen_random_bytes(32), 'hex')
where manage_token is null;

alter table public.shopify_orders
alter column manage_token set not null;

alter table public.shopify_orders
alter column manage_token set default encode(extensions.gen_random_bytes(32), 'hex');

create unique index if not exists shopify_orders_manage_token_key
on public.shopify_orders (manage_token);

alter table public.ticket_instances
add column if not exists invitation_email text,
add column if not exists invitation_sent_at timestamptz;
