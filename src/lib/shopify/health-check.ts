import "server-only";

import type { Session } from "@shopify/shopify-api";
import { createAdminGraphqlClient } from "@/lib/shopify/client";
import { markInstallationVerified } from "@/lib/shopify/installations";

type ShopHealth = {
  id: string;
  name: string;
  myshopifyDomain: string;
};

export async function verifyShopConnection(session: Session) {
  const client = await createAdminGraphqlClient(session);
  const response = await client.query<{
    data: {
      shop: ShopHealth;
    };
  }>({
    data: `#graphql
      query ShopifyConnectionHealth {
        shop {
          id
          name
          myshopifyDomain
        }
      }
    `,
  });

  const shop = response.body?.data?.shop;

  if (!shop) {
    throw new Error("Shopify health check returned no shop data.");
  }

  await markInstallationVerified(session.shop, {
    shopifyShopId: shop.id,
    shopName: shop.name,
  });

  return {
    shopifyShopId: shop.id,
    shopName: shop.name,
    myshopifyDomain: shop.myshopifyDomain,
  };
}
