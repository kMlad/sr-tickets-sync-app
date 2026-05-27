import "server-only";

export async function queueOrderWebhookProcessing(args: {
  shop: string;
  topic: string;
  body: string;
  webhookId: string;
}) {
  // Placeholder for durable order processing. The webhook route acknowledges fast
  // and this function will evolve into queue/worker-backed sync logic.
  console.info("Received Shopify order webhook", {
    shop: args.shop,
    topic: args.topic,
    webhookId: args.webhookId,
  });
}
