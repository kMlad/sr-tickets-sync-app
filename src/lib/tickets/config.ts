import "server-only";

import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type ConfigEvent = {
  id: string;
  name: string;
  startsAt: string | null;
  status: "draft" | "active" | "archived";
  isCurrent: boolean;
};

export type TicketProductMapping = {
  id: string;
  eventId: string;
  eventName: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  passTypeId: string | null;
  passTypeName: string | null;
  productTitle: string | null;
  createdAt: string;
};

export type ConfigPassType = {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  category: "free" | "paid";
  createdAt: string;
};

type EventRow = {
  id: string;
  name: string;
  starts_at: string | null;
  status: "draft" | "active" | "archived";
  is_current: boolean;
};

type MappingRow = {
  id: string;
  event_id: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  pass_type_id: string | null;
  product_title: string | null;
  created_at: string;
};

type PassTypeRow = {
  id: string;
  event_id: string;
  name: string;
  category: "free" | "paid";
  created_at: string;
};

export async function getTicketConfig() {
  const shop = env.SHOPIFY_ALLOWED_SHOP_DOMAIN;
  const supabase = createAdminClient();
  const [
    { data: events, error: eventsError },
    { data: mappings, error: mappingsError },
    { data: passTypes, error: passTypesError },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id,name,starts_at,status,is_current")
      .eq("shop", shop)
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("event_ticket_products")
      .select(
        "id,event_id,shopify_product_id,shopify_variant_id,pass_type_id,product_title,created_at",
      )
      .eq("shop", shop)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_pass_types")
      .select("id,event_id,name,category,created_at")
      .eq("shop", shop)
      .order("created_at", { ascending: false }),
  ]);

  if (eventsError) {
    throw new Error(`Failed to load events: ${eventsError.message}`);
  }

  if (mappingsError) {
    throw new Error(
      `Failed to load ticket product mappings: ${mappingsError.message}`,
    );
  }

  if (passTypesError) {
    throw new Error(`Failed to load pass types: ${passTypesError.message}`);
  }

  const eventRows = (events ?? []) as EventRow[];
  const eventNames = new Map(eventRows.map((event) => [event.id, event.name]));
  const passTypeRows = (passTypes ?? []) as PassTypeRow[];
  const passTypeNames = new Map(
    passTypeRows.map((passType) => [passType.id, passType.name]),
  );

  return {
    shop,
    currentEventId: eventRows.find((event) => event.is_current)?.id ?? null,
    events: eventRows.map((event) => ({
      id: event.id,
      name: event.name,
      startsAt: event.starts_at,
      status: event.status,
      isCurrent: event.is_current,
    })),
    mappings: ((mappings ?? []) as MappingRow[]).map((mapping) => ({
      id: mapping.id,
      eventId: mapping.event_id,
      eventName: eventNames.get(mapping.event_id) ?? "Deleted event",
      shopifyProductId: mapping.shopify_product_id,
      shopifyVariantId: mapping.shopify_variant_id,
      passTypeId: mapping.pass_type_id,
      passTypeName: mapping.pass_type_id
        ? (passTypeNames.get(mapping.pass_type_id) ?? "Deleted ticket type")
        : null,
      productTitle: mapping.product_title,
      createdAt: mapping.created_at,
    })),
    passTypes: passTypeRows.map((passType) => ({
      id: passType.id,
      eventId: passType.event_id,
      eventName: eventNames.get(passType.event_id) ?? "Deleted event",
      name: passType.name,
      category: passType.category,
      createdAt: passType.created_at,
    })),
  };
}
