import "server-only";

import { NextResponse } from "next/server";
import { getShopify } from "@/lib/shopify/client";
import { recordWebhookEvent } from "@/lib/shopify/installations";

export const runtime = "nodejs";

type WebhookHandler = (args: {
  shop: string;
  topic: string;
  body: string;
  webhookId: string;
}) => Promise<void>;

export async function handleShopifyWebhook(
  request: Request,
  handler: WebhookHandler,
) {
  const rawBody = await request.text();
  const shopify = getShopify();
  const validation = await shopify.webhooks.validate({
    rawBody,
    rawRequest: request,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: "Invalid webhook." }, { status: 401 });
  }

  const webhookId =
    "webhookId" in validation ? validation.webhookId : validation.eventId;

  const isNew = await recordWebhookEvent(
    webhookId,
    validation.domain,
    validation.topic,
  );

  if (!isNew) {
    return new NextResponse(null, { status: 200 });
  }

  await handler({
    shop: validation.domain,
    topic: validation.topic,
    body: rawBody,
    webhookId,
  });

  return new NextResponse(null, { status: 200 });
}
