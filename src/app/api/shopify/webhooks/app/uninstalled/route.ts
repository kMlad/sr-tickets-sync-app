import { markInstallationUninstalled } from "@/lib/shopify/installations";
import { handleShopifyWebhook } from "@/lib/shopify/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleShopifyWebhook(request, async ({ shop }) => {
    await markInstallationUninstalled(shop);
  });
}
