"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/env";
import { verifyAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const createEventSchema = z.object({
  name: z.string().trim().min(1).max(160),
  startsAt: z.string().trim().optional(),
});

const mappingSchema = z.object({
  eventId: z.uuid(),
  shopifyProductId: z.string().trim().regex(/^\d+$/),
  productTitle: z.string().trim().max(160).optional(),
});

const deleteMappingSchema = z.object({
  mappingId: z.uuid(),
});

function optionalTimestamp(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function configRedirect(status: string): never {
  redirect(`/config?status=${encodeURIComponent(status)}`);
}

export async function createEvent(formData: FormData) {
  await verifyAdminSession();

  const parsed = createEventSchema.safeParse({
    name: formData.get("name"),
    startsAt: formData.get("startsAt") || undefined,
  });

  if (!parsed.success) {
    configRedirect("event-invalid");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("events").insert({
    shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
    name: parsed.data.name,
    starts_at: optionalTimestamp(parsed.data.startsAt),
    status: "active",
  });

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  revalidatePath("/config");
  configRedirect("event-created");
}

export async function saveTicketProductMapping(formData: FormData) {
  await verifyAdminSession();

  const parsed = mappingSchema.safeParse({
    eventId: formData.get("eventId"),
    shopifyProductId: formData.get("shopifyProductId"),
    productTitle: formData.get("productTitle") || undefined,
  });

  if (!parsed.success) {
    configRedirect("mapping-invalid");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("event_ticket_products").upsert(
    {
      shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
      event_id: parsed.data.eventId,
      shopify_product_id: parsed.data.shopifyProductId,
      product_title: parsed.data.productTitle || null,
    },
    { onConflict: "shop,shopify_product_id" },
  );

  if (error) {
    throw new Error(`Failed to save ticket product mapping: ${error.message}`);
  }

  revalidatePath("/config");
  configRedirect("mapping-saved");
}

export async function deleteTicketProductMapping(formData: FormData) {
  await verifyAdminSession();

  const parsed = deleteMappingSchema.safeParse({
    mappingId: formData.get("mappingId"),
  });

  if (!parsed.success) {
    configRedirect("mapping-invalid");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_ticket_products")
    .delete()
    .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
    .eq("id", parsed.data.mappingId);

  if (error) {
    throw new Error(
      `Failed to delete ticket product mapping: ${error.message}`,
    );
  }

  revalidatePath("/config");
  configRedirect("mapping-deleted");
}
