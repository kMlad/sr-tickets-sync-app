import "server-only";

import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type ConfigEvent = {
  id: string;
  name: string;
  startsAt: string | null;
  status: "draft" | "active" | "archived";
};

export type TicketProductMapping = {
  id: string;
  eventId: string;
  eventName: string;
  shopifyProductId: string;
  productTitle: string | null;
  createdAt: string;
};

type EventRow = {
  id: string;
  name: string;
  starts_at: string | null;
  status: "draft" | "active" | "archived";
};

type MappingRow = {
  id: string;
  event_id: string;
  shopify_product_id: string;
  product_title: string | null;
  created_at: string;
};

export async function getTicketConfig() {
  const shop = env.SHOPIFY_ALLOWED_SHOP_DOMAIN;
  const supabase = createAdminClient();
  const [
    { data: events, error: eventsError },
    { data: mappings, error: mappingsError },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id,name,starts_at,status")
      .eq("shop", shop)
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("event_ticket_products")
      .select("id,event_id,shopify_product_id,product_title,created_at")
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

  const eventRows = (events ?? []) as EventRow[];
  const eventNames = new Map(eventRows.map((event) => [event.id, event.name]));

  return {
    shop,
    events: eventRows.map((event) => ({
      id: event.id,
      name: event.name,
      startsAt: event.starts_at,
      status: event.status,
    })),
    mappings: ((mappings ?? []) as MappingRow[]).map((mapping) => ({
      id: mapping.id,
      eventId: mapping.event_id,
      eventName: eventNames.get(mapping.event_id) ?? "Deleted event",
      shopifyProductId: mapping.shopify_product_id,
      productTitle: mapping.product_title,
      createdAt: mapping.created_at,
    })),
  };
}
