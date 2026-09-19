"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import {
  issueMediaPasses,
  mediaPassInputSchema,
} from "@/lib/tickets/media-passes";

function mediaPassRedirect(params: string): never {
  redirect(`/media-passes?${params}`);
}

export async function issueMediaPassBatch(formData: FormData) {
  await verifyAdminSession();

  const parsed = mediaPassInputSchema.safeParse({
    passTypeId: formData.get("passTypeId"),
    email: formData.get("email"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    mediaPassRedirect("error=invalid");
  }

  const result = await issueMediaPasses(parsed.data);

  if ("error" in result) {
    mediaPassRedirect(`error=${result.error}`);
  }

  revalidatePath("/media-passes");
  revalidatePath("/attendees");
  revalidatePath("/");

  mediaPassRedirect(
    result.emailFailed ? "status=issued-email-failed" : "status=issued",
  );
}
