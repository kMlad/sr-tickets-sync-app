import "server-only";

import { z } from "zod";
import { env } from "@/env";
import { sendMediaPassManagementEmail } from "@/lib/email/ticket-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEvent } from "@/lib/tickets/free-passes";
import { getTicketManageUrl } from "@/lib/tickets/order-management";

export const MEDIA_PASS_MAX_QUANTITY = 50;

export const mediaPassInputSchema = z.object({
  passTypeId: z.uuid(),
  email: z
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
  quantity: z.coerce.number().int().min(1).max(MEDIA_PASS_MAX_QUANTITY),
});

export type MediaPassInput = z.infer<typeof mediaPassInputSchema>;

export type MediaPassEvent = {
  id: string;
  name: string;
  startsAt: string | null;
};

export type MediaPassType = {
  id: string;
  name: string;
};

export type MediaPassBatch = {
  id: string;
  email: string | null;
  manageUrl: string;
  ticketCount: number;
  assignedCount: number;
  notificationSentAt: string | null;
  issuedAt: string | null;
};

export type MediaPassesDashboardData = {
  currentEvent: MediaPassEvent | null;
  passTypes: MediaPassType[];
  batches: MediaPassBatch[];
};

type BuyerRelation =
  | { email: string | null }
  | { email: string | null }[]
  | null;

type TicketRelation =
  | { id: string; status: "unassigned" | "assigned" | "cancelled" }
  | { id: string; status: "unassigned" | "assigned" | "cancelled" }[]
  | null;

type MediaOrderRow = {
  id: string;
  manage_token: string;
  buyer_notification_sent_at: string | null;
  ordered_at: string | null;
  buyers: BuyerRelation;
  ticket_instances: TicketRelation;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asList<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export async function getMediaPassesDashboard(
  limit = 25,
): Promise<MediaPassesDashboardData> {
  const currentEvent = await getCurrentEvent();

  if (!currentEvent) {
    return { currentEvent: null, passTypes: [], batches: [] };
  }

  const supabase = createAdminClient();
  const [
    { data: passTypes, error: passTypesError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("event_pass_types")
      .select("id,name")
      .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
      .eq("event_id", currentEvent.id)
      .eq("category", "media")
      .order("name", { ascending: true }),
    supabase
      .from("shopify_orders")
      .select(
        "id,manage_token,buyer_notification_sent_at,ordered_at,buyers(email),ticket_instances(id,status)",
      )
      .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
      .eq("source", "admin")
      .contains("source_payload", {
        kind: "media_passes",
        event_id: currentEvent.id,
      })
      .order("ordered_at", { ascending: false })
      .limit(limit),
  ]);

  if (passTypesError) {
    throw new Error(
      `Failed to load media pass types: ${passTypesError.message}`,
    );
  }

  if (ordersError) {
    throw new Error(`Failed to load media passes: ${ordersError.message}`);
  }

  return {
    currentEvent,
    passTypes: ((passTypes ?? []) as MediaPassType[]).map((passType) => ({
      id: passType.id,
      name: passType.name,
    })),
    batches: ((orders ?? []) as unknown as MediaOrderRow[]).map((order) => {
      const tickets = asList(order.ticket_instances);

      return {
        id: order.id,
        email: firstRelation(order.buyers)?.email ?? null,
        manageUrl: getTicketManageUrl(order.manage_token),
        ticketCount: tickets.length,
        assignedCount: tickets.filter((ticket) => ticket.status === "assigned")
          .length,
        notificationSentAt: order.buyer_notification_sent_at,
        issuedAt: order.ordered_at,
      };
    }),
  };
}

export type IssueMediaPassesResult =
  | { orderId: string; emailFailed: boolean }
  | {
      error: "no_current_event" | "pass_type_not_found" | "invalid_quantity";
    };

export async function issueMediaPasses(
  input: MediaPassInput,
): Promise<IssueMediaPassesResult> {
  const currentEvent = await getCurrentEvent();

  if (!currentEvent) {
    return { error: "no_current_event" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_media_pass_batch", {
    p_shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
    p_event_id: currentEvent.id,
    p_pass_type_id: input.passTypeId,
    p_email: input.email,
    p_quantity: input.quantity,
  });

  if (error) {
    if (error.message.includes("pass_type_not_found")) {
      return { error: "pass_type_not_found" };
    }

    if (error.message.includes("invalid_quantity")) {
      return { error: "invalid_quantity" };
    }

    throw new Error(`Failed to issue media passes: ${error.message}`);
  }

  const orderId = String(data);
  const { data: order, error: orderError } = await supabase
    .from("shopify_orders")
    .select("id,manage_token,shopify_order_name")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(`Failed to load media pass batch: ${orderError.message}`);
  }

  if (!order) {
    throw new Error("Media pass batch was created but could not be loaded.");
  }

  const emailSent = await sendMediaPassNotification({
    orderId,
    manageToken: String(order.manage_token),
    orderName: order.shopify_order_name
      ? String(order.shopify_order_name)
      : null,
    email: input.email,
    ticketCount: input.quantity,
  });

  return { orderId, emailFailed: !emailSent };
}

async function sendMediaPassNotification(args: {
  orderId: string;
  manageToken: string;
  orderName: string | null;
  email: string;
  ticketCount: number;
}) {
  try {
    await sendMediaPassManagementEmail({
      to: args.email,
      orderName: args.orderName,
      manageUrl: getTicketManageUrl(args.manageToken),
      ticketCount: args.ticketCount,
      idempotencyKey: `media-pass-management-${args.orderId}`,
    });
  } catch (error) {
    console.error("Failed to send media pass management email", {
      orderId: args.orderId,
      error,
    });
    return false;
  }

  const { error } = await createAdminClient()
    .from("shopify_orders")
    .update({ buyer_notification_sent_at: new Date().toISOString() })
    .eq("id", args.orderId);

  if (error) {
    console.error("Failed to mark media pass email as sent", {
      orderId: args.orderId,
      error,
    });
  }

  return true;
}
