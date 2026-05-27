import "server-only";

import { randomBytes } from "node:crypto";
import { sendBuyerTicketManagementEmail } from "@/lib/email/ticket-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicketManageUrl } from "@/lib/tickets/order-management";

type ShopifyOrderPayload = {
  id?: number | string;
  admin_graphql_api_id?: string;
  name?: string;
  order_number?: number | string;
  email?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  currency?: string | null;
  currency_code?: string | null;
  total_price?: string | number | null;
  created_at?: string | null;
  customer?: {
    id?: number | string;
    admin_graphql_api_id?: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
  line_items?: ShopifyLineItemPayload[];
};

type ShopifyLineItemPayload = {
  id?: number | string;
  admin_graphql_api_id?: string;
  product_id?: number | string | null;
  title?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  price?: string | number | null;
};

type ProductMapping = {
  event_id: string;
  shopify_product_id: string;
};

type SyncedOrder = {
  id: string;
  manageToken: string;
  buyerNotificationSentAt: string | null;
  orderName: string | null;
};

type SyncedOrderRow = {
  id: string;
  manage_token: string;
  buyer_notification_sent_at: string | null;
  shopify_order_name: string | null;
};

function asText(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function asNullableText(value: unknown) {
  return asText(value);
}

function asPositiveInteger(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 0;
  }

  return Math.floor(parsed);
}

function generateClaimToken() {
  return randomBytes(32).toString("base64url");
}

function generateManageToken() {
  return randomBytes(32).toString("base64url");
}

function getBuyerEmail(order: ShopifyOrderPayload) {
  return asNullableText(
    order.customer?.email ?? order.contact_email ?? order.email,
  )?.toLowerCase();
}

function getBuyerName(order: ShopifyOrderPayload) {
  const name = [order.customer?.first_name, order.customer?.last_name]
    .map((value) => asNullableText(value))
    .filter(Boolean)
    .join(" ");

  return name || null;
}

function toSyncedOrder(row: SyncedOrderRow): SyncedOrder {
  return {
    id: String(row.id),
    manageToken: String(row.manage_token),
    buyerNotificationSentAt: row.buyer_notification_sent_at
      ? String(row.buyer_notification_sent_at)
      : null,
    orderName: row.shopify_order_name ? String(row.shopify_order_name) : null,
  };
}

async function upsertBuyer(shop: string, order: ShopifyOrderPayload) {
  const supabase = createAdminClient();
  const customer = order.customer ?? null;
  const shopifyCustomerId = asText(
    customer?.id ?? customer?.admin_graphql_api_id,
  );
  const email = asNullableText(
    customer?.email ?? order.contact_email ?? order.email,
  )?.toLowerCase();
  const payload = {
    shop,
    shopify_customer_id: shopifyCustomerId,
    email,
    first_name: asNullableText(customer?.first_name),
    last_name: asNullableText(customer?.last_name),
    phone: asNullableText(customer?.phone ?? order.phone),
  };

  if (shopifyCustomerId) {
    const { data, error } = await supabase
      .from("buyers")
      .upsert(payload, { onConflict: "shop,shopify_customer_id" })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to upsert buyer: ${error.message}`);
    }

    return String(data.id);
  }

  if (!email) {
    return null;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("buyers")
    .select("id")
    .eq("shop", shop)
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to load buyer: ${lookupError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from("buyers")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      throw new Error(`Failed to update buyer: ${error.message}`);
    }

    return String(existing.id);
  }

  const { data, error } = await supabase
    .from("buyers")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create buyer: ${error.message}`);
  }

  return String(data.id);
}

async function upsertOrder(
  shop: string,
  buyerId: string | null,
  order: ShopifyOrderPayload,
): Promise<SyncedOrder> {
  const supabase = createAdminClient();
  const shopifyOrderId = asText(order.id ?? order.admin_graphql_api_id);

  if (!shopifyOrderId) {
    throw new Error("Shopify order payload is missing an order id.");
  }

  const payload = {
    shop,
    shopify_order_id: shopifyOrderId,
    shopify_order_name: asNullableText(order.name),
    order_number: asNullableText(order.order_number),
    buyer_id: buyerId,
    currency_code: asNullableText(order.currency_code ?? order.currency),
    total_price: order.total_price ?? null,
    ordered_at: asNullableText(order.created_at),
    source_payload: order,
    processed_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await supabase
    .from("shopify_orders")
    .select("id,manage_token,buyer_notification_sent_at,shopify_order_name")
    .eq("shop", shop)
    .eq("shopify_order_id", shopifyOrderId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to load Shopify order: ${lookupError.message}`);
  }

  if (existing) {
    const { data, error } = await supabase
      .from("shopify_orders")
      .update(payload)
      .eq("id", existing.id)
      .select("id,manage_token,buyer_notification_sent_at,shopify_order_name")
      .single();

    if (error) {
      throw new Error(`Failed to update Shopify order: ${error.message}`);
    }

    return toSyncedOrder(data as SyncedOrderRow);
  }

  const { data, error } = await supabase
    .from("shopify_orders")
    .insert({
      ...payload,
      manage_token: generateManageToken(),
    })
    .select("id,manage_token,buyer_notification_sent_at,shopify_order_name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return upsertOrder(shop, buyerId, order);
    }

    throw new Error(`Failed to create Shopify order: ${error.message}`);
  }

  return toSyncedOrder(data as SyncedOrderRow);
}

async function loadProductMappings(shop: string, productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, ProductMapping>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_ticket_products")
    .select("event_id,shopify_product_id")
    .eq("shop", shop)
    .in("shopify_product_id", productIds);

  if (error) {
    throw new Error(`Failed to load ticket product mappings: ${error.message}`);
  }

  return new Map(
    (data as ProductMapping[]).map((mapping) => [
      mapping.shopify_product_id,
      mapping,
    ]),
  );
}

export async function syncTicketsFromShopifyOrder(args: {
  shop: string;
  body: string;
}) {
  const order = JSON.parse(args.body) as ShopifyOrderPayload;
  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
  const productIds = [
    ...new Set(
      lineItems
        .map((lineItem) => asText(lineItem.product_id))
        .filter((productId): productId is string => Boolean(productId)),
    ),
  ];
  const productMappings = await loadProductMappings(args.shop, productIds);
  const ticketLineItems = lineItems.filter((lineItem) => {
    const productId = asText(lineItem.product_id);
    return productId ? productMappings.has(productId) : false;
  });

  if (ticketLineItems.length === 0) {
    return { ticketsCreated: 0, orderSynced: false };
  }

  const buyerId = await upsertBuyer(args.shop, order);
  const syncedOrder = await upsertOrder(args.shop, buyerId, order);
  const currencyCode = asNullableText(order.currency_code ?? order.currency);
  const rows = ticketLineItems.flatMap((lineItem) => {
    const productId = asText(lineItem.product_id);
    const lineItemId = asText(lineItem.id ?? lineItem.admin_graphql_api_id);
    const mapping = productId ? productMappings.get(productId) : undefined;
    const quantity = asPositiveInteger(lineItem.quantity);

    if (!productId || !lineItemId || !mapping || quantity === 0) {
      return [];
    }

    return Array.from({ length: quantity }, (_, index) => ({
      shop: args.shop,
      event_id: mapping.event_id,
      order_id: syncedOrder.id,
      buyer_id: buyerId,
      shopify_product_id: productId,
      shopify_line_item_id: lineItemId,
      shopify_line_item_position: index + 1,
      product_title: asNullableText(lineItem.title ?? lineItem.name),
      price: lineItem.price ?? null,
      currency_code: currencyCode,
      claim_token: generateClaimToken(),
    }));
  });

  if (rows.length === 0) {
    return { ticketsCreated: 0, orderSynced: true };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ticket_instances")
    .upsert(rows, {
      onConflict: "shop,shopify_line_item_id,shopify_line_item_position",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    throw new Error(`Failed to create ticket instances: ${error.message}`);
  }

  await sendBuyerNotificationIfNeeded({
    order: syncedOrder,
    buyerEmail: getBuyerEmail(order),
    buyerName: getBuyerName(order),
    ticketCount: rows.length,
  });

  return { ticketsCreated: data?.length ?? 0, orderSynced: true };
}

async function sendBuyerNotificationIfNeeded(args: {
  order: SyncedOrder;
  buyerEmail: string | null | undefined;
  buyerName: string | null;
  ticketCount: number;
}) {
  if (!args.buyerEmail || args.order.buyerNotificationSentAt) {
    return;
  }

  try {
    await sendBuyerTicketManagementEmail({
      to: args.buyerEmail,
      buyerName: args.buyerName,
      orderName: args.order.orderName,
      manageUrl: getTicketManageUrl(args.order.manageToken),
      ticketCount: args.ticketCount,
      idempotencyKey: `buyer-ticket-management-${args.order.id}`,
    });
  } catch (error) {
    console.error("Failed to send buyer ticket management email", {
      orderId: args.order.id,
      error,
    });
    return;
  }

  const { error } = await createAdminClient()
    .from("shopify_orders")
    .update({ buyer_notification_sent_at: new Date().toISOString() })
    .eq("id", args.order.id);

  if (error) {
    console.error("Failed to mark buyer ticket email as sent", {
      orderId: args.order.id,
      error,
    });
  }
}
