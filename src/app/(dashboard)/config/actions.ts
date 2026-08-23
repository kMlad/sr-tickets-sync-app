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

const mappingSchema = z
  .object({
    eventId: z.uuid(),
    shopifyProductId: z.string().trim().regex(/^\d+$/),
    shopifyVariantId: z.string().trim().regex(/^\d+$/).optional(),
    passTypeId: z.uuid().optional(),
    productTitle: z.string().trim().max(160).optional(),
  })
  .refine((mapping) => !mapping.shopifyVariantId || mapping.passTypeId, {
    message: "A ticket type is required for variant mappings.",
    path: ["passTypeId"],
  });

const deleteMappingSchema = z.object({
  mappingId: z.uuid(),
});

const setCurrentEventSchema = z.object({
  eventId: z.uuid(),
});

const passTypeSchema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  category: z.enum(["free", "paid"]),
});

const deletePassTypeSchema = z.object({
  passTypeId: z.uuid(),
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
    shopifyVariantId: formData.get("shopifyVariantId") || undefined,
    passTypeId: formData.get("passTypeId") || undefined,
    productTitle: formData.get("productTitle") || undefined,
  });

  if (!parsed.success) {
    configRedirect("mapping-invalid");
  }

  const supabase = createAdminClient();
  if (parsed.data.passTypeId) {
    const { data: passType, error: passTypeError } = await supabase
      .from("event_pass_types")
      .select("id")
      .eq("id", parsed.data.passTypeId)
      .eq("event_id", parsed.data.eventId)
      .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
      .maybeSingle();

    if (passTypeError) {
      throw new Error(
        `Failed to validate ticket type: ${passTypeError.message}`,
      );
    }

    if (!passType) {
      configRedirect("mapping-invalid");
    }
  }

  const { error } = await supabase.from("event_ticket_products").upsert(
    {
      shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
      event_id: parsed.data.eventId,
      shopify_product_id: parsed.data.shopifyProductId,
      shopify_variant_id: parsed.data.shopifyVariantId || null,
      pass_type_id: parsed.data.passTypeId || null,
      product_title: parsed.data.productTitle || null,
    },
    { onConflict: "shop,shopify_product_id,shopify_variant_id" },
  );

  if (error) {
    throw new Error(`Failed to save ticket product mapping: ${error.message}`);
  }

  revalidatePath("/config");
  configRedirect("mapping-saved");
}

export async function setCurrentEvent(formData: FormData) {
  await verifyAdminSession();

  const parsed = setCurrentEventSchema.safeParse({
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    configRedirect("current-event-invalid");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("set_current_event", {
    p_shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
    p_event_id: parsed.data.eventId,
  });

  if (error) {
    throw new Error(`Failed to set current event: ${error.message}`);
  }

  revalidatePath("/config");
  revalidatePath("/free-passes");
  configRedirect("current-event-set");
}

export async function createPassType(formData: FormData) {
  await verifyAdminSession();

  const parsed = passTypeSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    configRedirect("pass-type-invalid");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("event_pass_types").insert({
    shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
    event_id: parsed.data.eventId,
    name: parsed.data.name,
    category: parsed.data.category,
  });

  if (error) {
    if (error.code === "23505") {
      configRedirect("pass-type-duplicate");
    }

    throw new Error(`Failed to create pass type: ${error.message}`);
  }

  revalidatePath("/config");
  revalidatePath("/free-passes");
  configRedirect("pass-type-created");
}

export async function deletePassType(formData: FormData) {
  await verifyAdminSession();

  const parsed = deletePassTypeSchema.safeParse({
    passTypeId: formData.get("passTypeId"),
  });

  if (!parsed.success) {
    configRedirect("pass-type-invalid");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_pass_types")
    .delete()
    .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
    .eq("id", parsed.data.passTypeId);

  if (error) {
    if (error.code === "23503") {
      configRedirect("pass-type-in-use");
    }

    throw new Error(`Failed to delete pass type: ${error.message}`);
  }

  revalidatePath("/config");
  revalidatePath("/free-passes");
  configRedirect("pass-type-deleted");
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
