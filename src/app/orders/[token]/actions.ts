"use server";

import { redirect } from "next/navigation";
import {
  sendTicketInvite,
  sendTicketInviteInputSchema,
} from "@/lib/tickets/order-management";

export async function sendInvite(formData: FormData) {
  const token = formData.get("token");

  if (typeof token !== "string" || token.length === 0) {
    redirect("/");
  }

  const parsed = sendTicketInviteInputSchema.safeParse({
    ticketId: formData.get("ticketId"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect(`/orders/${encodeURIComponent(token)}?error=invalid`);
  }

  let result: Awaited<ReturnType<typeof sendTicketInvite>>;

  try {
    result = await sendTicketInvite(token, parsed.data);
  } catch (error) {
    console.error("Failed to send ticket invite", { error });
    redirect(`/orders/${encodeURIComponent(token)}?error=email_failed`);
  }

  if ("error" in result) {
    redirect(`/orders/${encodeURIComponent(token)}?error=${result.error}`);
  }

  redirect(
    `/orders/${encodeURIComponent(token)}?sent=${encodeURIComponent(parsed.data.ticketId)}`,
  );
}
