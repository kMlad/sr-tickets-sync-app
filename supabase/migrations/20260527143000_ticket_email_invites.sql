alter table public.shopify_orders
add column manage_token text,
add column buyer_notification_sent_at timestamptz;

update public.shopify_orders
set manage_token = encode(gen_random_bytes(32), 'hex')
where manage_token is null;

alter table public.shopify_orders
alter column manage_token set not null;

alter table public.shopify_orders
alter column manage_token set default encode(gen_random_bytes(32), 'hex');

create unique index shopify_orders_manage_token_key
on public.shopify_orders (manage_token);

alter table public.ticket_instances
add column invitation_email text,
add column invitation_sent_at timestamptz;
