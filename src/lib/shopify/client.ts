import "server-only";

import "@shopify/shopify-api/adapters/web-api";
import type { Shopify } from "@shopify/shopify-api";
import { ApiVersion, Session, shopifyApi } from "@shopify/shopify-api";
import { env } from "@/env";

export const SHOPIFY_AUTH_CALLBACK_PATH = "/api/shopify/auth/callback";

let shopifyClient: Shopify | null = null;

export function getShopify() {
  if (shopifyClient) {
    return shopifyClient;
  }

  const appUrl = new URL(env.SHOPIFY_APP_URL);

  shopifyClient = shopifyApi({
    apiKey: env.SHOPIFY_API_KEY,
    apiSecretKey: env.SHOPIFY_API_SECRET,
    scopes: env.SHOPIFY_SCOPES,
    hostName: appUrl.host,
    hostScheme: appUrl.protocol.replace(":", "") as "http" | "https",
    apiVersion: ApiVersion.January26,
    isEmbeddedApp: false,
  });

  return shopifyClient;
}

export function sessionFromInstallation(installation: {
  id: string;
  shop: string;
  scope: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
}) {
  return new Session({
    id: installation.id,
    shop: installation.shop,
    state: "",
    isOnline: false,
    scope: installation.scope ?? undefined,
    accessToken: installation.accessToken,
    refreshToken: installation.refreshToken ?? undefined,
    expires: installation.expiresAt
      ? new Date(installation.expiresAt)
      : undefined,
    refreshTokenExpires: installation.refreshTokenExpiresAt
      ? new Date(installation.refreshTokenExpiresAt)
      : undefined,
  });
}

export async function createAdminGraphqlClient(session: Session) {
  return new (getShopify().clients.Graphql)({ session });
}
