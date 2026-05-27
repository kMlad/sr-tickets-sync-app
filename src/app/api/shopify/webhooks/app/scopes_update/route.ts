import {
  getInstallationByShop,
  updateInstallationScopes,
} from "@/lib/shopify/installations";
import { hasRequiredScopes } from "@/lib/shopify/utils";
import { handleShopifyWebhook } from "@/lib/shopify/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleShopifyWebhook(request, async ({ shop, body }) => {
    const payload = JSON.parse(body) as { current?: string[] | string };
    const currentScopes = Array.isArray(payload.current)
      ? payload.current
      : typeof payload.current === "string"
        ? payload.current.split(",")
        : [];
    const scope = currentScopes.join(",");

    const installation = await getInstallationByShop(shop);

    if (!installation) {
      return;
    }

    await updateInstallationScopes(shop, scope);

    if (!hasRequiredScopes(scope)) {
      console.warn("Shopify installation is missing required scopes", {
        shop,
        scope,
      });
    }
  });
}
