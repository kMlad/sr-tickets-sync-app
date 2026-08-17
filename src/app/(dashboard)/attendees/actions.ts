"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/env";
import { verifyAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const agorifyStatusSchema = z.object({
  attendeeId: z.uuid(),
  addedInAgorify: z.enum(["true", "false"]),
});

export async function setAttendeeAgorifyStatus(formData: FormData) {
  await verifyAdminSession();

  const parsed = agorifyStatusSchema.safeParse({
    attendeeId: formData.get("attendeeId"),
    addedInAgorify: formData.get("addedInAgorify"),
  });

  if (!parsed.success) {
    throw new Error("Invalid attendee Agorify status update.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attendees")
    .update({ added_in_agorify: parsed.data.addedInAgorify === "true" })
    .eq("id", parsed.data.attendeeId)
    .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update attendee: ${error.message}`);
  }

  if (!data) {
    throw new Error("Attendee not found.");
  }

  revalidatePath("/attendees");
}
