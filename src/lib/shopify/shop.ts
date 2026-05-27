import "server-only";

import { env } from "@/env";

const SHOP_DOMAIN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

export function normalizeShopDomain(shop: string | null | undefined) {
  if (!shop) {
    return null;
  }

  const trimmed = shop.trim().toLowerCase();

  if (!SHOP_DOMAIN_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function assertAllowedShop(shop: string | null | undefined) {
  const normalized = normalizeShopDomain(shop);

  if (!normalized) {
    throw new Error("Invalid shop domain.");
  }

  if (normalized !== env.SHOPIFY_ALLOWED_SHOP_DOMAIN.toLowerCase()) {
    throw new Error("Shop domain is not allowed for this app.");
  }

  return normalized;
}

export function getAllowedShopDomain() {
  return env.SHOPIFY_ALLOWED_SHOP_DOMAIN.toLowerCase();
}
