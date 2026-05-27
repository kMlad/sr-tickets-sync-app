import "server-only";

import { syncTicketsFromShopifyOrder } from "@/lib/tickets/order-sync";

export async function queueOrderWebhookProcessing(args: {
  shop: string;
  topic: string;
  body: string;
  webhookId: string;
}) {
  const result = await syncTicketsFromShopifyOrder({
    shop: args.shop,
    body: args.body,
  });

  console.info("Received Shopify order webhook", {
    shop: args.shop,
    topic: args.topic,
    webhookId: args.webhookId,
    orderSynced: result.orderSynced,
    ticketsCreated: result.ticketsCreated,
  });
}
