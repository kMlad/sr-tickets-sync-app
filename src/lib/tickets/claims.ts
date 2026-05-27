import "server-only";

import { z } from "zod";
import { getShopifyAppUrl } from "@/lib/shopify/utils";
import { createAdminClient } from "@/lib/supabase/admin";

export type TicketClaimDetails = {
  ticket: {
    id: string;
    productTitle: string | null;
    status: "unassigned" | "assigned" | "cancelled";
    claimedAt: string | null;
  };
  event: {
    name: string;
    startsAt: string | null;
  } | null;
  attendee: {
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    affiliation: string | null;
    title: string | null;
    claimedAt: string;
  } | null;
  order: {
    name: string | null;
  } | null;
};

export const claimTicketInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
  affiliation: z.string().trim().min(1, "Company is required.").max(160),
  title: z.string().trim().min(1, "Position is required.").max(160),
});

export function getTicketClaimUrl(claimToken: string) {
  return getShopifyAppUrl(`/claim/${claimToken}`).toString();
}

type TicketRecord = {
  id: string;
  event_id: string;
  order_id: string;
  product_title: string | null;
  status: "unassigned" | "assigned" | "cancelled";
  claimed_at: string | null;
};

export async function getTicketClaimDetails(
  claimToken: string,
): Promise<TicketClaimDetails | null> {
  const supabase = createAdminClient();
  const { data: ticket, error: ticketError } = await supabase
    .from("ticket_instances")
    .select("id,event_id,order_id,product_title,status,claimed_at")
    .eq("claim_token", claimToken)
    .maybeSingle();

  if (ticketError) {
    throw new Error(`Failed to load ticket: ${ticketError.message}`);
  }

  if (!ticket) {
    return null;
  }

  const record = ticket as TicketRecord;
  const [
    { data: event, error: eventError },
    { data: attendee, error: attendeeError },
    { data: order, error: orderError },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("name,starts_at")
      .eq("id", record.event_id)
      .maybeSingle(),
    supabase
      .from("attendees")
      .select("name,first_name,last_name,email,affiliation,title,claimed_at")
      .eq("ticket_id", record.id)
      .maybeSingle(),
    supabase
      .from("shopify_orders")
      .select("shopify_order_name")
      .eq("id", record.order_id)
      .maybeSingle(),
  ]);

  if (eventError) {
    throw new Error(`Failed to load event: ${eventError.message}`);
  }

  if (attendeeError) {
    throw new Error(`Failed to load attendee: ${attendeeError.message}`);
  }

  if (orderError) {
    throw new Error(`Failed to load order: ${orderError.message}`);
  }

  return {
    ticket: {
      id: record.id,
      productTitle: record.product_title,
      status: record.status,
      claimedAt: record.claimed_at,
    },
    event: event
      ? {
          name: String(event.name),
          startsAt: event.starts_at ? String(event.starts_at) : null,
        }
      : null,
    attendee: attendee
      ? {
          name: String(attendee.name),
          firstName: attendee.first_name ? String(attendee.first_name) : null,
          lastName: attendee.last_name ? String(attendee.last_name) : null,
          email: String(attendee.email),
          affiliation: attendee.affiliation
            ? String(attendee.affiliation)
            : null,
          title: attendee.title ? String(attendee.title) : null,
          claimedAt: String(attendee.claimed_at),
        }
      : null,
    order: order
      ? {
          name: order.shopify_order_name
            ? String(order.shopify_order_name)
            : null,
        }
      : null,
  };
}

export async function claimTicket(
  claimToken: string,
  input: z.infer<typeof claimTicketInputSchema>,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("claim_ticket", {
    p_claim_token: claimToken,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_affiliation: input.affiliation,
    p_title: input.title,
    p_metadata: {},
  });

  if (!error) {
    return { attendeeId: String(data) };
  }

  if (error.message.includes("ticket_already_claimed")) {
    return { error: "already_claimed" as const };
  }

  if (error.message.includes("ticket_not_found")) {
    return { error: "not_found" as const };
  }

  throw new Error(`Failed to claim ticket: ${error.message}`);
}
