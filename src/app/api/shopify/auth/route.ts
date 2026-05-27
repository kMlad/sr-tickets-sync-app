import { NextResponse } from "next/server";
import { getShopify, SHOPIFY_AUTH_CALLBACK_PATH } from "@/lib/shopify/client";
import { getActiveInstallation } from "@/lib/shopify/installations";
import { assertAllowedShop } from "@/lib/shopify/shop";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");

  if (!shopParam) {
    return NextResponse.json(
      { error: "Missing shop parameter." },
      { status: 400 },
    );
  }

  try {
    const shop = assertAllowedShop(shopParam);
    const query = Object.fromEntries(url.searchParams.entries());

    const shopify = getShopify();

    if (query.hmac && !(await shopify.utils.validateHmac(query))) {
      return NextResponse.json(
        { error: "Invalid install request." },
        { status: 401 },
      );
    }

    const existingInstallation = await getActiveInstallation(shop);

    if (existingInstallation) {
      return NextResponse.redirect(new URL("/shopify?connected=1", url));
    }

    const response = await shopify.auth.begin({
      shop,
      callbackPath: SHOPIFY_AUTH_CALLBACK_PATH,
      isOnline: false,
      rawRequest: request,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Shopify OAuth.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
