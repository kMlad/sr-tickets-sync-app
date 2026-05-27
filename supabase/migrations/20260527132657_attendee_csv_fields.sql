drop function if exists "public"."claim_ticket"(p_claim_token text, p_name text, p_email text, p_phone text, p_metadata jsonb);

alter table "public"."attendees" add column "affiliation" text;

alter table "public"."attendees" add column "attendee_type" text not null default 'attendee'::text;

alter table "public"."attendees" add column "badge_type" text;

alter table "public"."attendees" add column "first_name" text;

alter table "public"."attendees" add column "last_name" text;

alter table "public"."attendees" add column "title" text;

alter table "public"."attendees" add constraint "attendees_attendee_type_check" CHECK ((attendee_type = 'attendee'::text)) not valid;

alter table "public"."attendees" validate constraint "attendees_attendee_type_check";

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
$function$
;


