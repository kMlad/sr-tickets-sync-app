import "server-only";

import { env } from "@/env";

export function getShopifyAppUrl(path = "/") {
  const url = new URL(env.SHOPIFY_APP_URL);
  url.pathname = path;
  url.search = "";
  url.hash = "";
  return url;
}

export function getShopifyAuthUrl(shop: string) {
  const url = getShopifyAppUrl("/api/shopify/auth");
  url.searchParams.set("shop", shop);
  return url;
}

export function applySetCookieHeaders(
  target: Headers,
  source: HeadersInit | undefined,
) {
  if (!source) {
    return;
  }

  const headers = new Headers(source);

  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      target.append("set-cookie", value);
    }
  }
}

export function getRequiredScopes() {
  return new Set(env.SHOPIFY_SCOPES);
}

export function hasRequiredScopes(scope: string | null | undefined) {
  if (!scope) {
    return false;
  }

  const granted = new Set(
    scope
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  return [...getRequiredScopes()].every((requiredScope) =>
    granted.has(requiredScope),
  );
}
