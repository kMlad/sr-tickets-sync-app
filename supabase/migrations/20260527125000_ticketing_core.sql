create table "public"."events" (
  "id" uuid not null default gen_random_uuid(),
  "shop" text not null,
  "name" text not null,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "status" text not null default 'active'::text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."events" enable row level security;

create table "public"."event_ticket_products" (
  "id" uuid not null default gen_random_uuid(),
  "event_id" uuid not null,
  "shop" text not null,
  "shopify_product_id" text not null,
  "product_title" text,
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."event_ticket_products" enable row level security;

create table "public"."buyers" (
  "id" uuid not null default gen_random_uuid(),
  "shop" text not null,
  "shopify_customer_id" text,
  "email" text,
  "first_name" text,
  "last_name" text,
  "phone" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."buyers" enable row level security;

create table "public"."shopify_orders" (
  "id" uuid not null default gen_random_uuid(),
  "shop" text not null,
  "shopify_order_id" text not null,
  "shopify_order_name" text,
  "order_number" text,
  "buyer_id" uuid,
  "currency_code" text,
  "total_price" numeric,
  "ordered_at" timestamp with time zone,
  "source_payload" jsonb not null,
  "processed_at" timestamp with time zone not null default now(),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."shopify_orders" enable row level security;

create table "public"."ticket_instances" (
  "id" uuid not null default gen_random_uuid(),
  "shop" text not null,
  "event_id" uuid not null,
  "order_id" uuid not null,
  "buyer_id" uuid,
  "shopify_product_id" text not null,
  "shopify_line_item_id" text not null,
  "shopify_line_item_position" integer not null,
  "product_title" text,
  "price" numeric,
  "currency_code" text,
  "claim_token" text not null,
  "status" text not null default 'unassigned'::text,
  "claimed_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."ticket_instances" enable row level security;

create table "public"."attendees" (
  "id" uuid not null default gen_random_uuid(),
  "ticket_id" uuid not null,
  "shop" text not null,
  "event_id" uuid not null,
  "order_id" uuid not null,
  "buyer_id" uuid,
  "name" text not null,
  "email" text not null,
  "phone" text,
  "metadata" jsonb not null default '{}'::jsonb,
  "claimed_at" timestamp with time zone not null default now(),
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."attendees" enable row level security;

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX events_id_shop_key ON public.events USING btree (id, shop);

CREATE INDEX events_shop_starts_at_idx ON public.events USING btree (shop, starts_at);

CREATE UNIQUE INDEX event_ticket_products_pkey ON public.event_ticket_products USING btree (id);

CREATE UNIQUE INDEX event_ticket_products_shop_shopify_product_id_key ON public.event_ticket_products USING btree (shop, shopify_product_id);

CREATE INDEX event_ticket_products_event_id_idx ON public.event_ticket_products USING btree (event_id);

CREATE UNIQUE INDEX buyers_pkey ON public.buyers USING btree (id);

CREATE UNIQUE INDEX buyers_shop_shopify_customer_id_key ON public.buyers USING btree (shop, shopify_customer_id);

CREATE INDEX buyers_shop_email_idx ON public.buyers USING btree (shop, email);

CREATE UNIQUE INDEX shopify_orders_pkey ON public.shopify_orders USING btree (id);

CREATE UNIQUE INDEX shopify_orders_shop_shopify_order_id_key ON public.shopify_orders USING btree (shop, shopify_order_id);

CREATE INDEX shopify_orders_shop_ordered_at_idx ON public.shopify_orders USING btree (shop, ordered_at);

CREATE UNIQUE INDEX ticket_instances_pkey ON public.ticket_instances USING btree (id);

CREATE UNIQUE INDEX ticket_instances_claim_token_key ON public.ticket_instances USING btree (claim_token);

CREATE UNIQUE INDEX ticket_instances_line_item_instance_key ON public.ticket_instances USING btree (shop, shopify_line_item_id, shopify_line_item_position);

CREATE INDEX ticket_instances_event_status_idx ON public.ticket_instances USING btree (event_id, status);

CREATE INDEX ticket_instances_order_id_idx ON public.ticket_instances USING btree (order_id);

CREATE UNIQUE INDEX attendees_pkey ON public.attendees USING btree (id);

CREATE UNIQUE INDEX attendees_ticket_id_key ON public.attendees USING btree (ticket_id);

CREATE INDEX attendees_event_id_idx ON public.attendees USING btree (event_id);

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."event_ticket_products" add constraint "event_ticket_products_pkey" PRIMARY KEY using index "event_ticket_products_pkey";

alter table "public"."buyers" add constraint "buyers_pkey" PRIMARY KEY using index "buyers_pkey";

alter table "public"."shopify_orders" add constraint "shopify_orders_pkey" PRIMARY KEY using index "shopify_orders_pkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_pkey" PRIMARY KEY using index "ticket_instances_pkey";

alter table "public"."attendees" add constraint "attendees_pkey" PRIMARY KEY using index "attendees_pkey";

alter table "public"."events" add constraint "events_shop_fkey" FOREIGN KEY (shop) REFERENCES public.shopify_installations(shop) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_shop_fkey";

alter table "public"."events" add constraint "events_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text]))) not valid;

alter table "public"."events" validate constraint "events_status_check";

alter table "public"."events" add constraint "events_id_shop_key" UNIQUE using index "events_id_shop_key";

alter table "public"."event_ticket_products" add constraint "event_ticket_products_event_id_shop_fkey" FOREIGN KEY (event_id, shop) REFERENCES public.events(id, shop) ON DELETE CASCADE not valid;

alter table "public"."event_ticket_products" validate constraint "event_ticket_products_event_id_shop_fkey";

alter table "public"."event_ticket_products" add constraint "event_ticket_products_shop_shopify_product_id_key" UNIQUE using index "event_ticket_products_shop_shopify_product_id_key";

alter table "public"."buyers" add constraint "buyers_shop_fkey" FOREIGN KEY (shop) REFERENCES public.shopify_installations(shop) ON DELETE CASCADE not valid;

alter table "public"."buyers" validate constraint "buyers_shop_fkey";

alter table "public"."buyers" add constraint "buyers_shop_shopify_customer_id_key" UNIQUE using index "buyers_shop_shopify_customer_id_key";

alter table "public"."shopify_orders" add constraint "shopify_orders_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) ON DELETE SET NULL not valid;

alter table "public"."shopify_orders" validate constraint "shopify_orders_buyer_id_fkey";

alter table "public"."shopify_orders" add constraint "shopify_orders_shop_fkey" FOREIGN KEY (shop) REFERENCES public.shopify_installations(shop) ON DELETE CASCADE not valid;

alter table "public"."shopify_orders" validate constraint "shopify_orders_shop_fkey";

alter table "public"."shopify_orders" add constraint "shopify_orders_shop_shopify_order_id_key" UNIQUE using index "shopify_orders_shop_shopify_order_id_key";

alter table "public"."ticket_instances" add constraint "ticket_instances_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) ON DELETE SET NULL not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_buyer_id_fkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_event_id_fkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.shopify_orders(id) ON DELETE CASCADE not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_order_id_fkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_shop_fkey" FOREIGN KEY (shop) REFERENCES public.shopify_installations(shop) ON DELETE CASCADE not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_shop_fkey";

alter table "public"."ticket_instances" add constraint "ticket_instances_status_check" CHECK ((status = ANY (ARRAY['unassigned'::text, 'assigned'::text, 'cancelled'::text]))) not valid;

alter table "public"."ticket_instances" validate constraint "ticket_instances_status_check";

alter table "public"."ticket_instances" add constraint "ticket_instances_claim_token_key" UNIQUE using index "ticket_instances_claim_token_key";

alter table "public"."ticket_instances" add constraint "ticket_instances_line_item_instance_key" UNIQUE using index "ticket_instances_line_item_instance_key";

alter table "public"."attendees" add constraint "attendees_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) ON DELETE SET NULL not valid;

alter table "public"."attendees" validate constraint "attendees_buyer_id_fkey";

alter table "public"."attendees" add constraint "attendees_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."attendees" validate constraint "attendees_event_id_fkey";

alter table "public"."attendees" add constraint "attendees_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.shopify_orders(id) ON DELETE CASCADE not valid;

alter table "public"."attendees" validate constraint "attendees_order_id_fkey";

alter table "public"."attendees" add constraint "attendees_shop_fkey" FOREIGN KEY (shop) REFERENCES public.shopify_installations(shop) ON DELETE CASCADE not valid;

alter table "public"."attendees" validate constraint "attendees_shop_fkey";

alter table "public"."attendees" add constraint "attendees_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.ticket_instances(id) ON DELETE CASCADE not valid;

alter table "public"."attendees" validate constraint "attendees_ticket_id_fkey";

alter table "public"."attendees" add constraint "attendees_ticket_id_key" UNIQUE using index "attendees_ticket_id_key";

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER buyers_set_updated_at BEFORE UPDATE ON public.buyers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER shopify_orders_set_updated_at BEFORE UPDATE ON public.shopify_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ticket_instances_set_updated_at BEFORE UPDATE ON public.ticket_instances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

create or replace function public.claim_ticket(
  p_claim_token text,
  p_name text,
  p_email text,
  p_phone text default null,
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
    email,
    phone,
    metadata
  )
  values (
    v_ticket.id,
    v_ticket.shop,
    v_ticket.event_id,
    v_ticket.order_id,
    v_ticket.buyer_id,
    trim(p_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_phone, '')), ''),
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
