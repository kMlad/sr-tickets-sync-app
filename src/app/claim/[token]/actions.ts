"use server";

import { redirect } from "next/navigation";
import { claimTicket, claimTicketInputSchema } from "@/lib/tickets/claims";

export async function submitClaim(formData: FormData) {
  const token = formData.get("token");

  if (typeof token !== "string" || token.length === 0) {
    redirect("/");
  }

  const parsed = claimTicketInputSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    affiliation: formData.get("affiliation"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect(`/claim/${encodeURIComponent(token)}?error=invalid`);
  }

  const result = await claimTicket(token, parsed.data);

  if ("error" in result) {
    redirect(`/claim/${encodeURIComponent(token)}?error=${result.error}`);
  }

  redirect(
    result.emailFailed
      ? `/claim/${encodeURIComponent(token)}?claimed=1&error=email_failed`
      : `/claim/${encodeURIComponent(token)}?claimed=1`,
  );
}
