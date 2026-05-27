import "server-only";

import { z } from "zod";
import { sendAttendeeTicketClaimEmail } from "@/lib/email/ticket-emails";
import { getShopifyAppUrl } from "@/lib/shopify/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicketClaimUrl } from "@/lib/tickets/claims";

export const sendTicketInviteInputSchema = z.object({
  ticketId: z.uuid(),
  email: z
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
});

type OrderRow = {
  id: string;
  buyer_id: string | null;
  shopify_order_name: string | null;
  ordered_at: string | null;
};

type BuyerRow = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

type TicketRow = {
  id: string;
  event_id: string;
  claim_token: string;
  product_title: string | null;
  status: "unassigned" | "assigned" | "cancelled";
  invitation_email: string | null;
  invitation_sent_at: string | null;
  claimed_at: string | null;
  shopify_line_item_position: number;
};

type EventRow = {
  id: string;
  name: string;
  starts_at: string | null;
};

type AttendeeRow = {
  ticket_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  affiliation: string | null;
  title: string | null;
  claimed_at: string;
};

export type ManagedOrderDetails = {
  order: {
    id: string;
    name: string | null;
    buyerEmail: string | null;
    buyerName: string | null;
    orderedAt: string | null;
  };
  tickets: {
    id: string;
    claimUrl: string;
    productTitle: string | null;
    status: "unassigned" | "assigned" | "cancelled";
    invitedEmail: string | null;
    invitationSentAt: string | null;
    claimedAt: string | null;
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
  }[];
};

export function getTicketManageUrl(manageToken: string) {
  return getShopifyAppUrl(`/orders/${manageToken}`).toString();
}

function buyerName(buyer: BuyerRow | null) {
  const name = [buyer?.first_name, buyer?.last_name].filter(Boolean).join(" ");
  return name || null;
}

async function getOrderByManageToken(manageToken: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shopify_orders")
    .select("id,buyer_id,shopify_order_name,ordered_at")
    .eq("manage_token", manageToken)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  return data ? (data as OrderRow) : null;
}

export async function getManagedOrderDetails(
  manageToken: string,
): Promise<ManagedOrderDetails | null> {
  const supabase = createAdminClient();
  const order = await getOrderByManageToken(manageToken);

  if (!order) {
    return null;
  }

  const [
    { data: buyer, error: buyerError },
    { data: tickets, error: ticketError },
  ] = await Promise.all([
    order.buyer_id
      ? supabase
          .from("buyers")
          .select("email,first_name,last_name")
          .eq("id", order.buyer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("ticket_instances")
      .select(
        "id,event_id,claim_token,product_title,status,invitation_email,invitation_sent_at,claimed_at,shopify_line_item_position",
      )
      .eq("order_id", order.id)
      .order("shopify_line_item_position", { ascending: true }),
  ]);

  if (buyerError) {
    throw new Error(`Failed to load buyer: ${buyerError.message}`);
  }

  if (ticketError) {
    throw new Error(`Failed to load tickets: ${ticketError.message}`);
  }

  const ticketRows = (tickets ?? []) as TicketRow[];
  const ticketIds = ticketRows.map((ticket) => ticket.id);
  const eventIds = [
    ...new Set(ticketRows.map((ticket) => ticket.event_id).filter(Boolean)),
  ];

  const [
    { data: events, error: eventError },
    { data: attendees, error: attendeeError },
  ] = await Promise.all([
    eventIds.length
      ? supabase.from("events").select("id,name,starts_at").in("id", eventIds)
      : Promise.resolve({ data: [], error: null }),
    ticketIds.length
      ? supabase
          .from("attendees")
          .select(
            "ticket_id,name,first_name,last_name,email,affiliation,title,claimed_at",
          )
          .in("ticket_id", ticketIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventError) {
    throw new Error(`Failed to load events: ${eventError.message}`);
  }

  if (attendeeError) {
    throw new Error(`Failed to load attendees: ${attendeeError.message}`);
  }

  const eventsById = new Map(
    ((events ?? []) as EventRow[]).map((event) => [event.id, event]),
  );
  const attendeesByTicketId = new Map(
    ((attendees ?? []) as AttendeeRow[]).map((attendee) => [
      attendee.ticket_id,
      attendee,
    ]),
  );
  const buyerRecord = buyer ? (buyer as BuyerRow) : null;

  return {
    order: {
      id: order.id,
      name: order.shopify_order_name,
      buyerEmail: buyerRecord?.email ?? null,
      buyerName: buyerName(buyerRecord),
      orderedAt: order.ordered_at,
    },
    tickets: ticketRows.map((ticket) => {
      const event = eventsById.get(ticket.event_id) ?? null;
      const attendee = attendeesByTicketId.get(ticket.id) ?? null;

      return {
        id: ticket.id,
        claimUrl: getTicketClaimUrl(ticket.claim_token),
        productTitle: ticket.product_title,
        status: ticket.status,
        invitedEmail: ticket.invitation_email,
        invitationSentAt: ticket.invitation_sent_at,
        claimedAt: ticket.claimed_at,
        event: event
          ? {
              name: event.name,
              startsAt: event.starts_at,
            }
          : null,
        attendee: attendee
          ? {
              name: attendee.name,
              firstName: attendee.first_name,
              lastName: attendee.last_name,
              email: attendee.email,
              affiliation: attendee.affiliation,
              title: attendee.title,
              claimedAt: attendee.claimed_at,
            }
          : null,
      };
    }),
  };
}

export async function sendTicketInvite(
  manageToken: string,
  input: z.infer<typeof sendTicketInviteInputSchema>,
) {
  const supabase = createAdminClient();
  const order = await getOrderByManageToken(manageToken);

  if (!order) {
    return { error: "not_found" as const };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("ticket_instances")
    .select("id,event_id,claim_token,product_title,status")
    .eq("id", input.ticketId)
    .eq("order_id", order.id)
    .maybeSingle();

  if (ticketError) {
    throw new Error(`Failed to load ticket: ${ticketError.message}`);
  }

  if (!ticket) {
    return { error: "not_found" as const };
  }

  const ticketRecord = ticket as Pick<
    TicketRow,
    "id" | "event_id" | "claim_token" | "product_title" | "status"
  >;

  if (ticketRecord.status !== "unassigned") {
    return { error: "already_assigned" as const };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("name")
    .eq("id", ticketRecord.event_id)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Failed to load event: ${eventError.message}`);
  }

  await sendAttendeeTicketClaimEmail({
    to: input.email,
    eventName: event?.name ? String(event.name) : null,
    orderName: order.shopify_order_name,
    ticketName: ticketRecord.product_title,
    claimUrl: getTicketClaimUrl(ticketRecord.claim_token),
    idempotencyKey: `ticket-invite-${ticketRecord.id}-${input.email}`,
  });

  const { error: updateError } = await supabase
    .from("ticket_instances")
    .update({
      invitation_email: input.email,
      invitation_sent_at: new Date().toISOString(),
    })
    .eq("id", ticketRecord.id);

  if (updateError) {
    throw new Error(`Failed to update ticket invite: ${updateError.message}`);
  }

  return { sent: true as const };
}
