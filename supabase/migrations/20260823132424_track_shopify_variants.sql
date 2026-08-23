alter table "public"."event_ticket_products" drop constraint "event_ticket_products_shop_shopify_product_id_key";

drop index if exists "public"."event_ticket_products_shop_shopify_product_id_key";

alter table "public"."event_ticket_products" add column "pass_type_id" uuid;

alter table "public"."event_ticket_products" add column "shopify_variant_id" text;

alter table "public"."ticket_instances" add column "shopify_variant_id" text;

CREATE UNIQUE INDEX event_ticket_products_shop_shopify_product_id_shopify_varia_key ON public.event_ticket_products USING btree (shop, shopify_product_id, shopify_variant_id) NULLS NOT DISTINCT;

alter table "public"."event_ticket_products" add constraint "event_ticket_products_pass_type_id_fkey" FOREIGN KEY (pass_type_id) REFERENCES public.event_pass_types(id) ON DELETE RESTRICT not valid;

alter table "public"."event_ticket_products" validate constraint "event_ticket_products_pass_type_id_fkey";

alter table "public"."event_ticket_products" add constraint "event_ticket_products_shop_shopify_product_id_shopify_varia_key" UNIQUE using index "event_ticket_products_shop_shopify_product_id_shopify_varia_key";

alter table "public"."event_ticket_products" add constraint "event_ticket_products_variant_pass_type_required" CHECK (((shopify_variant_id IS NULL) OR (pass_type_id IS NOT NULL))) not valid;

alter table "public"."event_ticket_products" validate constraint "event_ticket_products_variant_pass_type_required";

set check_function_bodies = off;

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


