import "server-only";

import { sendAttendeeRegistrationConfirmationEmail } from "@/lib/email/ticket-emails";
import { createAdminClient } from "@/lib/supabase/admin";

type ConfirmationRow = {
  id: string;
  email: string;
  first_name: string | null;
  name: string;
  confirmation_sent_at: string | null;
  events:
    | { name: string; starts_at: string | null }
    | { name: string; starts_at: string | null }[]
    | null;
  event_pass_types: { name: string } | { name: string }[] | null;
  ticket_instances:
    | { product_title: string | null }
    | { product_title: string | null }[]
    | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function sendAndRecordAttendeeConfirmation(
  attendeeId: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attendees")
    .select(
      "id,email,first_name,name,confirmation_sent_at,events(name,starts_at),event_pass_types(name),ticket_instances(product_title)",
    )
    .eq("id", attendeeId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load attendee for confirmation email", error);
    return false;
  }

  if (!data) {
    console.error("Attendee not found for confirmation email", { attendeeId });
    return false;
  }

  const row = data as ConfirmationRow;

  if (row.confirmation_sent_at) {
    return true;
  }

  const event = firstRelation(row.events);
  const passType = firstRelation(row.event_pass_types);
  const ticket = firstRelation(row.ticket_instances);

  try {
    await sendAttendeeRegistrationConfirmationEmail({
      to: row.email,
      attendeeName: row.first_name || row.name || null,
      eventName: event?.name ?? null,
      passTypeName: passType?.name ?? ticket?.product_title ?? null,
      eventStartsAt: event?.starts_at ?? null,
      idempotencyKey: `attendee-confirmation-${row.id}`,
    });
  } catch (sendError) {
    // The attendee is already recorded; a failed send must not undo that.
    // confirmation_sent_at stays null so the send can be retried later.
    console.error("Failed to send attendee confirmation email", sendError);
    return false;
  }

  const { error: updateError } = await supabase
    .from("attendees")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", attendeeId);

  if (updateError) {
    console.error(
      "Failed to record attendee confirmation timestamp",
      updateError.message,
    );
  }

  return true;
}
