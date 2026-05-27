import { queueOrderWebhookProcessing } from "@/lib/shopify/orders";
import { handleShopifyWebhook } from "@/lib/shopify/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleShopifyWebhook(request, queueOrderWebhookProcessing);
}
