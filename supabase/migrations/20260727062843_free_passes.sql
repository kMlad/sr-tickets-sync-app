
  create table "public"."event_pass_types" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "shop" text not null,
    "name" text not null,
    "category" text not null default 'free'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."event_pass_types" enable row level security;

alter table "public"."attendees" add column "confirmation_sent_at" timestamp with time zone;

alter table "public"."attendees" add column "pass_type_id" uuid;

alter table "public"."attendees" add column "source" text not null default 'shopify'::text;

alter table "public"."attendees" alter column "order_id" drop not null;

alter table "public"."events" add column "is_current" boolean not null default false;

alter table "public"."ticket_instances" add column "pass_type_id" uuid;

alter table "public"."ticket_instances" add column "source" text not null default 'shopify'::text;

alter table "public"."ticket_instances" alter column "order_id" drop not null;

alter table "public"."ticket_instances" alter column "shopify_line_item_id" drop not null;

alter table "public"."ticket_instances" alter column "shopify_line_item_position" drop not null;

alter table "public"."ticket_instances" alter column "shopify_product_id" drop not null;

CREATE UNIQUE INDEX attendees_admin_event_email_key ON public.attendees USING btree (event_id, email) WHERE (source = 'admin'::text);

CREATE INDEX event_pass_types_event_id_idx ON public.event_pass_types USING btree (event_id);

CREATE UNIQUE INDEX event_pass_types_event_id_name_key ON public.event_pass_types USING btree (event_id, name);

CREATE UNIQUE INDEX event_pass_types_pkey ON public.event_pass_types USING btree (id);

CREATE UNIQUE INDEX events_current_event_key ON public.events USING btree (shop) WHERE is_current;

alter table "public"."event_pass_types" add constraint "event_pass_types_pkey" PRIMARY KEY using index "event_pass_types_pkey";

alter table "public"."attendees" add constraint "attendees_pass_type_id_fkey" FOREIGN KEY (pass_type_id) REFERENCES public.event_pass_types(id) ON DELETE SET NULL not valid;

alter table "public"."attendees" validate constraint "attendees_pass_type_id_fkey";

alter table "public"."attendees" add constraint "attendees_source_check" CHECK ((source = ANY (ARRAY['shopify'::text, 'admin'::text]))) not valid;

alter table "public"."attendees" validate constraint "attendees_source_check";

alter table "public"."event_pass_types" add constraint "event_pass_types_category_check" CHECK ((category = ANY (ARRAY['free'::text, 'paid'::text]))) not valid;

alter table "public"."event_pass_types" validate constraint "event_pass_types_category_check";

alter table "public"."event_pass_types" add constraint "event_pass_types_event_id_name_key" UNIQUE using index "event_pass_types_event_id_name_key";

alter table "public"."event_pass_types" add constraint "event_pass_types_event_id_shop_fkey" FOREIGN KEY (event_id, shop) REFERENCES public.events(id, shop) ON DELETE CASCADE not valid;

alter table "public"."event_pass_types" validate constraint "event_pass_types_event_id_shop_fkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_pass_type_id_fkey" FOREIGN KEY (pass_type_id) REFERENCES public.event_pass_types(id) ON DELETE SET NULL not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_pass_type_id_fkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_shopify_fields_required" CHECK (((source <> 'shopify'::text) OR ((order_id IS NOT NULL) AND (shopify_product_id IS NOT NULL) AND (shopify_line_item_id IS NOT NULL) AND (shopify_line_item_position IS NOT NULL)))) not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_shopify_fields_required";

alter table "public"."ticket_instances" add constraint "ticket_instances_source_check" CHECK ((source = ANY (ARRAY['shopify'::text, 'admin'::text]))) not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_source_check";

set check_function_bodies = off;

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
$function$
;

CREATE OR REPLACE FUNCTION public.set_current_event(p_shop text, p_event_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

grant delete on table "public"."event_pass_types" to "anon";

grant insert on table "public"."event_pass_types" to "anon";

grant references on table "public"."event_pass_types" to "anon";

grant select on table "public"."event_pass_types" to "anon";

grant trigger on table "public"."event_pass_types" to "anon";

grant truncate on table "public"."event_pass_types" to "anon";

grant update on table "public"."event_pass_types" to "anon";

grant delete on table "public"."event_pass_types" to "authenticated";

grant insert on table "public"."event_pass_types" to "authenticated";

grant references on table "public"."event_pass_types" to "authenticated";

grant select on table "public"."event_pass_types" to "authenticated";

grant trigger on table "public"."event_pass_types" to "authenticated";

grant truncate on table "public"."event_pass_types" to "authenticated";

grant update on table "public"."event_pass_types" to "authenticated";

grant delete on table "public"."event_pass_types" to "service_role";

grant insert on table "public"."event_pass_types" to "service_role";

grant references on table "public"."event_pass_types" to "service_role";

grant select on table "public"."event_pass_types" to "service_role";

grant trigger on table "public"."event_pass_types" to "service_role";

grant truncate on table "public"."event_pass_types" to "service_role";

grant update on table "public"."event_pass_types" to "service_role";


