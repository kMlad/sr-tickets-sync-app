import "server-only";

import { z } from "zod";
import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAndRecordAttendeeConfirmation } from "@/lib/tickets/attendee-confirmation";
import {
  claimTicketInputSchema,
  generateClaimToken,
} from "@/lib/tickets/claims";

export const freePassInputSchema = claimTicketInputSchema.extend({
  passTypeId: z.uuid(),
});

export type FreePassInput = z.infer<typeof freePassInputSchema>;

export type FreePassEvent = {
  id: string;
  name: string;
  startsAt: string | null;
};

export type FreePassType = {
  id: string;
  name: string;
};

export type FreePassAttendee = {
  id: string;
  name: string;
  email: string;
  affiliation: string | null;
  title: string | null;
  badgeType: string | null;
  confirmationSentAt: string | null;
  claimedAt: string;
};

export type FreePassesDashboardData = {
  currentEvent: FreePassEvent | null;
  passTypes: FreePassType[];
  attendees: FreePassAttendee[];
};

type EventRow = {
  id: string;
  name: string;
  starts_at: string | null;
};

type PassTypeRow = {
  id: string;
  name: string;
};

type AttendeeRow = {
  id: string;
  name: string;
  email: string;
  affiliation: string | null;
  title: string | null;
  badge_type: string | null;
  confirmation_sent_at: string | null;
  claimed_at: string;
};

export async function getCurrentEvent(): Promise<FreePassEvent | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,starts_at")
    .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load current event: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as EventRow;

  return { id: row.id, name: row.name, startsAt: row.starts_at };
}

export async function getFreePassesDashboard(
  limit = 25,
): Promise<FreePassesDashboardData> {
  const currentEvent = await getCurrentEvent();

  if (!currentEvent) {
    return { currentEvent: null, passTypes: [], attendees: [] };
  }

  const supabase = createAdminClient();
  const [
    { data: passTypes, error: passTypesError },
    { data: attendees, error: attendeesError },
  ] = await Promise.all([
    supabase
      .from("event_pass_types")
      .select("id,name")
      .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
      .eq("event_id", currentEvent.id)
      .eq("category", "free")
      .order("name", { ascending: true }),
    supabase
      .from("attendees")
      .select(
        "id,name,email,affiliation,title,badge_type,confirmation_sent_at,claimed_at",
      )
      .eq("shop", env.SHOPIFY_ALLOWED_SHOP_DOMAIN)
      .eq("event_id", currentEvent.id)
      .eq("source", "admin")
      .order("claimed_at", { ascending: false })
      .limit(limit),
  ]);

  if (passTypesError) {
    throw new Error(
      `Failed to load free pass types: ${passTypesError.message}`,
    );
  }

  if (attendeesError) {
    throw new Error(`Failed to load free passes: ${attendeesError.message}`);
  }

  return {
    currentEvent,
    passTypes: ((passTypes ?? []) as PassTypeRow[]).map((passType) => ({
      id: passType.id,
      name: passType.name,
    })),
    attendees: ((attendees ?? []) as AttendeeRow[]).map((attendee) => ({
      id: attendee.id,
      name: attendee.name,
      email: attendee.email,
      affiliation: attendee.affiliation,
      title: attendee.title,
      badgeType: attendee.badge_type,
      confirmationSentAt: attendee.confirmation_sent_at,
      claimedAt: attendee.claimed_at,
    })),
  };
}

export type CreateFreePassResult =
  | { attendeeId: string; emailFailed: boolean }
  | { error: "no_current_event" | "pass_type_not_found" | "email_exists" };

export async function createFreePassAttendee(
  input: FreePassInput,
): Promise<CreateFreePassResult> {
  const currentEvent = await getCurrentEvent();

  if (!currentEvent) {
    return { error: "no_current_event" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_free_pass_attendee", {
    p_shop: env.SHOPIFY_ALLOWED_SHOP_DOMAIN,
    p_event_id: currentEvent.id,
    p_pass_type_id: input.passTypeId,
    p_claim_token: generateClaimToken(),
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_affiliation: input.affiliation,
    p_title: input.title,
    p_metadata: {},
  });

  if (error) {
    if (error.message.includes("attendee_email_exists")) {
      return { error: "email_exists" };
    }

    if (error.message.includes("pass_type_not_found")) {
      return { error: "pass_type_not_found" };
    }

    throw new Error(`Failed to create free pass attendee: ${error.message}`);
  }

  const attendeeId = String(data);
  const emailSent = await sendAndRecordAttendeeConfirmation(attendeeId);

  return { attendeeId, emailFailed: !emailSent };
}
