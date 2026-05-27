import "server-only";

import type { Session } from "@shopify/shopify-api";
import { decryptSecret, encryptSecret } from "@/lib/shopify/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type ShopifyInstallationRecord = {
  id: string;
  shop: string;
  scope: string | null;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  expires_at: string | null;
  refresh_token_expires_at: string | null;
  status: "active" | "uninstalled";
  shopify_shop_id: string | null;
  shop_name: string | null;
  installed_at: string;
  uninstalled_at: string | null;
  last_verified_at: string | null;
};

export type ShopifyInstallation = {
  id: string;
  shop: string;
  scope: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  status: "active" | "uninstalled";
  shopifyShopId: string | null;
  shopName: string | null;
  installedAt: string;
  uninstalledAt: string | null;
  lastVerifiedAt: string | null;
};

function mapInstallation(
  record: ShopifyInstallationRecord,
): ShopifyInstallation {
  return {
    id: record.id,
    shop: record.shop,
    scope: record.scope,
    accessToken: record.encrypted_access_token
      ? decryptSecret(record.encrypted_access_token)
      : "",
    refreshToken: record.encrypted_refresh_token
      ? decryptSecret(record.encrypted_refresh_token)
      : null,
    expiresAt: record.expires_at,
    refreshTokenExpiresAt: record.refresh_token_expires_at,
    status: record.status,
    shopifyShopId: record.shopify_shop_id,
    shopName: record.shop_name,
    installedAt: record.installed_at,
    uninstalledAt: record.uninstalled_at,
    lastVerifiedAt: record.last_verified_at,
  };
}

export async function getActiveInstallation(shop: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shopify_installations")
    .select("*")
    .eq("shop", shop)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Shopify installation: ${error.message}`);
  }

  return data?.encrypted_access_token
    ? mapInstallation(data as ShopifyInstallationRecord)
    : null;
}

export async function getInstallationByShop(shop: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shopify_installations")
    .select("*")
    .eq("shop", shop)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Shopify installation: ${error.message}`);
  }

  return data ? mapInstallation(data as ShopifyInstallationRecord) : null;
}

export async function upsertInstallationFromSession(session: Session) {
  if (!session.accessToken) {
    throw new Error("Session is missing an access token.");
  }

  const supabase = createAdminClient();
  const payload = {
    id: session.id,
    shop: session.shop,
    scope: session.scope ?? null,
    encrypted_access_token: encryptSecret(session.accessToken),
    encrypted_refresh_token: session.refreshToken
      ? encryptSecret(session.refreshToken)
      : null,
    expires_at: session.expires?.toISOString() ?? null,
    refresh_token_expires_at:
      session.refreshTokenExpires?.toISOString() ?? null,
    status: "active",
    uninstalled_at: null,
    installed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("shopify_installations")
    .upsert(payload, { onConflict: "shop" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to store Shopify installation: ${error.message}`);
  }

  return mapInstallation(data as ShopifyInstallationRecord);
}

export async function markInstallationVerified(
  shop: string,
  details: { shopifyShopId?: string; shopName?: string },
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shopify_installations")
    .update({
      last_verified_at: new Date().toISOString(),
      shopify_shop_id: details.shopifyShopId ?? null,
      shop_name: details.shopName ?? null,
      status: "active",
      uninstalled_at: null,
    })
    .eq("shop", shop);

  if (error) {
    throw new Error(`Failed to update Shopify installation: ${error.message}`);
  }
}

export async function updateInstallationScopes(shop: string, scope: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shopify_installations")
    .update({ scope })
    .eq("shop", shop);

  if (error) {
    throw new Error(`Failed to update Shopify scopes: ${error.message}`);
  }
}

export async function markInstallationUninstalled(shop: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("shopify_installations")
    .update({
      status: "uninstalled",
      uninstalled_at: new Date().toISOString(),
      encrypted_access_token: null,
      encrypted_refresh_token: null,
      expires_at: null,
      refresh_token_expires_at: null,
      scope: null,
    })
    .eq("shop", shop);

  if (error) {
    throw new Error(
      `Failed to mark Shopify installation uninstalled: ${error.message}`,
    );
  }
}

export async function recordWebhookEvent(
  webhookId: string,
  shop: string,
  topic: string,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("shopify_webhook_events").insert({
    webhook_id: webhookId,
    shop,
    topic,
  });

  if (error?.code === "23505") {
    return false;
  }

  if (error) {
    throw new Error(`Failed to record webhook event: ${error.message}`);
  }

  return true;
}
