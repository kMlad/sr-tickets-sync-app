import { NextResponse } from "next/server";
import { getShopify } from "@/lib/shopify/client";
import { verifyShopConnection } from "@/lib/shopify/health-check";
import { upsertInstallationFromSession } from "@/lib/shopify/installations";
import { assertAllowedShop } from "@/lib/shopify/shop";
import { applySetCookieHeaders } from "@/lib/shopify/utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const shopify = getShopify();
    const { headers, session } = await shopify.auth.callback({
      rawRequest: request,
    });

    assertAllowedShop(session.shop);
    await upsertInstallationFromSession(session);
    await verifyShopConnection(session);

    const response = NextResponse.redirect(
      new URL("/shopify?installed=1", url),
    );
    applySetCookieHeaders(response.headers, headers);

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shopify OAuth callback failed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
