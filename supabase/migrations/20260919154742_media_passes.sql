alter table "public"."event_pass_types" drop constraint "event_pass_types_category_check";

alter table "public"."shopify_orders" add column "source" text not null default 'shopify'::text;

alter table "public"."shopify_orders" add constraint "shopify_orders_source_check" CHECK ((source = ANY (ARRAY['shopify'::text, 'admin'::text]))) not valid;

alter table "public"."shopify_orders" validate constraint "shopify_orders_source_check";

alter table "public"."event_pass_types" add constraint "event_pass_types_category_check" CHECK ((category = ANY (ARRAY['free'::text, 'paid'::text, 'media'::text]))) not valid;

alter table "public"."event_pass_types" validate constraint "event_pass_types_category_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_media_pass_batch(p_shop text, p_event_id uuid, p_pass_type_id uuid, p_email text, p_quantity integer)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_pass_type public.event_pass_types%rowtype;
  v_email text := lower(trim(p_email));
  v_buyer_id uuid;
  v_order_id uuid;
  v_i integer;
begin
  if p_quantity < 1 or p_quantity > 50 then
    raise exception 'invalid_quantity';
  end if;

  select *
  into v_pass_type
  from public.event_pass_types
  where id = p_pass_type_id
    and event_id = p_event_id
    and shop = p_shop
    and category = 'media';

  if not found then
    raise exception 'pass_type_not_found';
  end if;

  select id
  into v_buyer_id
  from public.buyers
  where shop = p_shop
    and email = v_email
  order by created_at desc
  limit 1;

  if v_buyer_id is null then
    insert into public.buyers (shop, email)
    values (p_shop, v_email)
    returning id into v_buyer_id;
  end if;

  insert into public.shopify_orders (
    shop,
    shopify_order_id,
    shopify_order_name,
    buyer_id,
    total_price,
    ordered_at,
    source,
    source_payload
  )
  values (
    p_shop,
    'admin-media-' || gen_random_uuid()::text,
    'Media passes',
    v_buyer_id,
    0,
    now(),
    'admin',
    jsonb_build_object(
      'source', 'admin',
      'kind', 'media_passes',
      'event_id', p_event_id,
      'quantity', p_quantity,
      'email', v_email
    )
  )
  returning id into v_order_id;

  for v_i in 1..p_quantity loop
    insert into public.ticket_instances (
      shop,
      event_id,
      order_id,
      buyer_id,
      pass_type_id,
      source,
      product_title,
      price,
      claim_token,
      shopify_line_item_position,
      status
    )
    values (
      p_shop,
      p_event_id,
      v_order_id,
      v_buyer_id,
      v_pass_type.id,
      'admin',
      v_pass_type.name,
      0,
      encode(extensions.gen_random_bytes(32), 'hex'),
      v_i,
      'unassigned'
    );
  end loop;

  return v_order_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_ticket(p_claim_token text, p_first_name text, p_last_name text, p_email text, p_affiliation text, p_title text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
    v_ticket.id,
    v_ticket.shop,
    v_ticket.event_id,
    v_ticket.order_id,
    v_ticket.buyer_id,
    v_ticket.pass_type_id,
    v_ticket.source,
    concat_ws(' ', trim(p_first_name), trim(p_last_name)),
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    'attendee',
    trim(p_affiliation),
    trim(p_title),
    coalesce(
      (select name from public.event_pass_types where id = v_ticket.pass_type_id),
      v_ticket.product_title
    ),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_attendee_id;

  update public.ticket_instances
  set status = 'assigned',
      claimed_at = now()
  where id = v_ticket.id;

  return v_attendee_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_free_pass_attendee(p_shop text, p_event_id uuid, p_pass_type_id uuid, p_claim_token text, p_first_name text, p_last_name text, p_email text, p_affiliation text, p_title text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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

  if not found or v_pass_type.category <> 'free' then
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
$function$
;

grant execute on function public.create_media_pass_batch(text, uuid, uuid, text, integer) to service_role;


