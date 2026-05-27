
  create table "public"."shopify_installations" (
    "id" text not null,
    "shop" text not null,
    "scope" text,
    "encrypted_access_token" text,
    "encrypted_refresh_token" text,
    "expires_at" timestamp with time zone,
    "refresh_token_expires_at" timestamp with time zone,
    "status" text not null default 'active'::text,
    "shopify_shop_id" text,
    "shop_name" text,
    "installed_at" timestamp with time zone not null default now(),
    "uninstalled_at" timestamp with time zone,
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."shopify_installations" enable row level security;


  create table "public"."shopify_webhook_events" (
    "webhook_id" text not null,
    "shop" text not null,
    "topic" text not null,
    "received_at" timestamp with time zone not null default now()
      );


alter table "public"."shopify_webhook_events" enable row level security;

CREATE UNIQUE INDEX shopify_installations_pkey ON public.shopify_installations USING btree (id);

CREATE UNIQUE INDEX shopify_installations_shop_key ON public.shopify_installations USING btree (shop);

CREATE UNIQUE INDEX shopify_webhook_events_pkey ON public.shopify_webhook_events USING btree (webhook_id);

CREATE INDEX shopify_webhook_events_shop_topic_idx ON public.shopify_webhook_events USING btree (shop, topic);

alter table "public"."shopify_installations" add constraint "shopify_installations_pkey" PRIMARY KEY using index "shopify_installations_pkey";

alter table "public"."shopify_webhook_events" add constraint "shopify_webhook_events_pkey" PRIMARY KEY using index "shopify_webhook_events_pkey";

alter table "public"."shopify_installations" add constraint "shopify_installations_shop_key" UNIQUE using index "shopify_installations_shop_key";

alter table "public"."shopify_installations" add constraint "shopify_installations_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'uninstalled'::text]))) not valid;

alter table "public"."shopify_installations" validate constraint "shopify_installations_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."shopify_installations" to "anon";

grant insert on table "public"."shopify_installations" to "anon";

grant references on table "public"."shopify_installations" to "anon";

grant select on table "public"."shopify_installations" to "anon";

grant trigger on table "public"."shopify_installations" to "anon";

grant truncate on table "public"."shopify_installations" to "anon";

grant update on table "public"."shopify_installations" to "anon";

grant delete on table "public"."shopify_installations" to "authenticated";

grant insert on table "public"."shopify_installations" to "authenticated";

grant references on table "public"."shopify_installations" to "authenticated";

grant select on table "public"."shopify_installations" to "authenticated";

grant trigger on table "public"."shopify_installations" to "authenticated";

grant truncate on table "public"."shopify_installations" to "authenticated";

grant update on table "public"."shopify_installations" to "authenticated";

grant delete on table "public"."shopify_installations" to "service_role";

grant insert on table "public"."shopify_installations" to "service_role";

grant references on table "public"."shopify_installations" to "service_role";

grant select on table "public"."shopify_installations" to "service_role";

grant trigger on table "public"."shopify_installations" to "service_role";

grant truncate on table "public"."shopify_installations" to "service_role";

grant update on table "public"."shopify_installations" to "service_role";

grant delete on table "public"."shopify_webhook_events" to "anon";

grant insert on table "public"."shopify_webhook_events" to "anon";

grant references on table "public"."shopify_webhook_events" to "anon";

grant select on table "public"."shopify_webhook_events" to "anon";

grant trigger on table "public"."shopify_webhook_events" to "anon";

grant truncate on table "public"."shopify_webhook_events" to "anon";

grant update on table "public"."shopify_webhook_events" to "anon";

grant delete on table "public"."shopify_webhook_events" to "authenticated";

grant insert on table "public"."shopify_webhook_events" to "authenticated";

grant references on table "public"."shopify_webhook_events" to "authenticated";

grant select on table "public"."shopify_webhook_events" to "authenticated";

grant trigger on table "public"."shopify_webhook_events" to "authenticated";

grant truncate on table "public"."shopify_webhook_events" to "authenticated";

grant update on table "public"."shopify_webhook_events" to "authenticated";

grant delete on table "public"."shopify_webhook_events" to "service_role";

grant insert on table "public"."shopify_webhook_events" to "service_role";

grant references on table "public"."shopify_webhook_events" to "service_role";

grant select on table "public"."shopify_webhook_events" to "service_role";

grant trigger on table "public"."shopify_webhook_events" to "service_role";

grant truncate on table "public"."shopify_webhook_events" to "service_role";

grant update on table "public"."shopify_webhook_events" to "service_role";

CREATE TRIGGER shopify_installations_set_updated_at BEFORE UPDATE ON public.shopify_installations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


