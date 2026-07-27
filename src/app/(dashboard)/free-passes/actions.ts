"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import {
  createFreePassAttendee,
  freePassInputSchema,
} from "@/lib/tickets/free-passes";

function freePassRedirect(params: string): never {
  redirect(`/free-passes?${params}`);
}

export async function addFreePass(formData: FormData) {
  await verifyAdminSession();

  const parsed = freePassInputSchema.safeParse({
    passTypeId: formData.get("passTypeId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    affiliation: formData.get("affiliation"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    freePassRedirect("error=invalid");
  }

  const result = await createFreePassAttendee(parsed.data);

  if ("error" in result) {
    freePassRedirect(`error=${result.error}`);
  }

  revalidatePath("/free-passes");
  revalidatePath("/attendees");
  revalidatePath("/");

  freePassRedirect(
    result.emailFailed ? "status=added-email-failed" : "status=added",
  );
}
