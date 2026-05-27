import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTicketClaimUrl } from "@/lib/tickets/claims";

type TicketRow = {
  id: string;
  claim_token: string;
  status: "unassigned" | "assigned" | "cancelled";
  product_title: string | null;
  created_at: string;
  events: { name: string } | { name: string }[] | null;
  shopify_orders:
    | { shopify_order_name: string | null }
    | { shopify_order_name: string | null }[]
    | null;
};

export type DashboardTicket = {
  id: string;
  status: "unassigned" | "assigned" | "cancelled";
  productTitle: string | null;
  eventName: string | null;
  orderName: string | null;
  claimUrl: string;
  createdAt: string;
};

export async function getRecentTickets(limit = 20): Promise<DashboardTicket[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ticket_instances")
    .select(
      "id,claim_token,status,product_title,created_at,events(name),shopify_orders(shopify_order_name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recent tickets: ${error.message}`);
  }

  return ((data ?? []) as unknown as TicketRow[]).map((ticket) => ({
    id: ticket.id,
    status: ticket.status,
    productTitle: ticket.product_title,
    eventName: firstRelation(ticket.events)?.name ?? null,
    orderName: firstRelation(ticket.shopify_orders)?.shopify_order_name ?? null,
    claimUrl: getTicketClaimUrl(ticket.claim_token),
    createdAt: ticket.created_at,
  }));
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
