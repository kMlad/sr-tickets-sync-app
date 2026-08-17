import "server-only";

import { env } from "@/env";
import { createAdminClient } from "@/lib/supabase/admin";

export {
  AGORIFY_ATTENDEE_CSV_HEADERS,
  buildAgorifyAttendeesCsv,
} from "@/lib/tickets/attendees-csv";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Relation<T> = T | T[] | null;

type AttendeeRow = {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  attendee_type: string | null;
  affiliation: string | null;
  title: string | null;
  badge_type: string | null;
  added_in_agorify: boolean;
  source: "shopify" | "admin";
  claimed_at: string;
  events: Relation<{
    id: string;
    name: string;
    starts_at: string | null;
  }>;
  ticket_instances: Relation<{
    id: string;
    status: "unassigned" | "assigned" | "cancelled";
    product_title: string | null;
  }>;
  shopify_orders: Relation<{
    shopify_order_name: string | null;
    order_number: string | null;
  }>;
};

type EventRow = {
  id: string;
  name: string;
  starts_at: string | null;
  status: "draft" | "active" | "archived";
};

type WeekRow = {
  claimed_at: string;
};

export type AgorifyStatusFilter = "added" | "not-added";

export type AttendeeFilterInput = {
  eventId?: string | null;
  week?: string | null;
  agorifyStatus?: string | null;
};

export type NormalizedAttendeeFilters = {
  eventId: string | null;
  week: string | null;
  weekStartIso: string | null;
  weekEndIso: string | null;
  agorifyStatus: AgorifyStatusFilter | null;
};

export type AttendeeEventOption = {
  id: string;
  name: string;
  startsAt: string | null;
  status: "draft" | "active" | "archived";
};

export type AttendeeWeekOption = {
  value: string;
  startIso: string;
  endIso: string;
  count: number;
};

export type AdminAttendee = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  attendeeType: string;
  affiliation: string | null;
  title: string | null;
  badgeType: string | null;
  addedInAgorify: boolean;
  source: "shopify" | "admin";
  claimedAt: string;
  week: string;
  event: {
    id: string;
    name: string;
    startsAt: string | null;
  } | null;
  ticket: {
    id: string;
    status: "unassigned" | "assigned" | "cancelled";
    productTitle: string | null;
  } | null;
  order: {
    name: string | null;
    number: string | null;
  } | null;
};

export type AttendeesDashboardData = {
  shop: string;
  filters: NormalizedAttendeeFilters;
  events: AttendeeEventOption[];
  weeks: AttendeeWeekOption[];
  attendees: AdminAttendee[];
};

export function normalizeAttendeeFilters(
  input: AttendeeFilterInput,
): NormalizedAttendeeFilters {
  const eventId =
    input.eventId && UUID_PATTERN.test(input.eventId) ? input.eventId : null;
  const weekStart = input.week ? parseDateKey(input.week) : null;
  const agorifyStatus =
    input.agorifyStatus === "added" || input.agorifyStatus === "not-added"
      ? input.agorifyStatus
      : null;

  if (!weekStart) {
    return {
      eventId,
      week: null,
      weekStartIso: null,
      weekEndIso: null,
      agorifyStatus,
    };
  }

  const normalizedWeekStart = startOfUtcWeek(weekStart);
  const weekEnd = addUtcDays(normalizedWeekStart, 7);

  return {
    eventId,
    week: formatDateKey(normalizedWeekStart),
    weekStartIso: normalizedWeekStart.toISOString(),
    weekEndIso: weekEnd.toISOString(),
    agorifyStatus,
  };
}

export async function getAttendeesDashboard(
  input: AttendeeFilterInput = {},
): Promise<AttendeesDashboardData> {
  const shop = env.SHOPIFY_ALLOWED_SHOP_DOMAIN;
  const filters = normalizeAttendeeFilters(input);
  const supabase = createAdminClient();

  const [
    { data: events, error: eventsError },
    { data: weekRows, error: weeksError },
    attendees,
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id,name,starts_at,status")
      .eq("shop", shop)
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    getWeekRows(filters),
    getAttendees(filters),
  ]);

  if (eventsError) {
    throw new Error(`Failed to load events: ${eventsError.message}`);
  }

  if (weeksError) {
    throw new Error(`Failed to load attendee weeks: ${weeksError.message}`);
  }

  return {
    shop,
    filters,
    events: ((events ?? []) as EventRow[]).map((event) => ({
      id: event.id,
      name: event.name,
      startsAt: event.starts_at,
      status: event.status,
    })),
    weeks: buildWeekOptions((weekRows ?? []) as WeekRow[]),
    attendees,
  };
}

export async function getAttendeesForExport(
  input: AttendeeFilterInput = {},
): Promise<AdminAttendee[]> {
  return getAttendees(normalizeAttendeeFilters(input), {
    excludeAddedInAgorify: true,
  });
}

function getWeekRows(filters: NormalizedAttendeeFilters) {
  const shop = env.SHOPIFY_ALLOWED_SHOP_DOMAIN;
  const supabase = createAdminClient();
  let query = supabase
    .from("attendees")
    .select("claimed_at")
    .eq("shop", shop)
    .order("claimed_at", { ascending: false });

  if (filters.eventId) {
    query = query.eq("event_id", filters.eventId);
  }

  if (filters.agorifyStatus) {
    query = query.eq("added_in_agorify", filters.agorifyStatus === "added");
  }

  return query;
}

async function getAttendees(
  filters: NormalizedAttendeeFilters,
  options: { excludeAddedInAgorify?: boolean } = {},
): Promise<AdminAttendee[]> {
  const shop = env.SHOPIFY_ALLOWED_SHOP_DOMAIN;
  const supabase = createAdminClient();
  let query = supabase
    .from("attendees")
    .select(
      [
        "id",
        "name",
        "first_name",
        "last_name",
        "email",
        "phone",
        "attendee_type",
        "affiliation",
        "title",
        "badge_type",
        "added_in_agorify",
        "source",
        "claimed_at",
        "events(id,name,starts_at)",
        "ticket_instances(id,status,product_title)",
        "shopify_orders(shopify_order_name,order_number)",
      ].join(","),
    )
    .eq("shop", shop)
    .order("claimed_at", { ascending: false });

  if (filters.eventId) {
    query = query.eq("event_id", filters.eventId);
  }

  if (filters.weekStartIso && filters.weekEndIso) {
    query = query
      .gte("claimed_at", filters.weekStartIso)
      .lt("claimed_at", filters.weekEndIso);
  }

  if (options.excludeAddedInAgorify) {
    query = query.eq("added_in_agorify", false);
  } else if (filters.agorifyStatus) {
    query = query.eq("added_in_agorify", filters.agorifyStatus === "added");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load attendees: ${error.message}`);
  }

  return ((data ?? []) as unknown as AttendeeRow[]).map(mapAttendee);
}

function mapAttendee(row: AttendeeRow): AdminAttendee {
  const event = firstRelation(row.events);
  const ticket = firstRelation(row.ticket_instances);
  const order = firstRelation(row.shopify_orders);
  const fallbackNames = splitName(row.name);

  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name ?? fallbackNames.firstName,
    lastName: row.last_name ?? fallbackNames.lastName,
    email: row.email,
    phone: row.phone,
    attendeeType: row.attendee_type ?? "attendee",
    affiliation: row.affiliation,
    title: row.title,
    badgeType: row.badge_type ?? ticket?.product_title ?? null,
    addedInAgorify: row.added_in_agorify,
    source: row.source,
    claimedAt: row.claimed_at,
    week: formatDateKey(startOfUtcWeek(new Date(row.claimed_at))),
    event: event
      ? {
          id: event.id,
          name: event.name,
          startsAt: event.starts_at,
        }
      : null,
    ticket: ticket
      ? {
          id: ticket.id,
          status: ticket.status,
          productTitle: ticket.product_title,
        }
      : null,
    order: order
      ? {
          name: order.shopify_order_name,
          number: order.order_number,
        }
      : null,
  };
}

function buildWeekOptions(rows: WeekRow[]): AttendeeWeekOption[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = formatDateKey(startOfUtcWeek(new Date(row.claimed_at)));
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].map(([value, count]) => {
    const start = parseDateKey(value) ?? new Date(`${value}T00:00:00.000Z`);
    const end = addUtcDays(start, 7);

    return {
      value,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      count,
    };
  });
}

function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function firstRelation<T>(value: Relation<T>) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfUtcWeek(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = start.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setUTCDate(start.getUTCDate() + diff);

  return start;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
