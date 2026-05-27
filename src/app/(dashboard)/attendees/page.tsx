import Link from "next/link";
import {
  type AttendeeWeekOption,
  getAttendeesDashboard,
} from "@/lib/tickets/attendees";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatWeekRange(startIso: string, endIso: string) {
  const end = new Date(endIso);
  end.setUTCDate(end.getUTCDate() - 1);

  return `${formatDate(startIso)} - ${formatDate(end.toISOString())}`;
}

function formatWeekValue(value: string) {
  const start = new Date(`${value}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
}

function buildAttendeesUrl(
  pathname: string,
  filters: { eventId: string | null; week: string | null },
) {
  const params = new URLSearchParams();

  if (filters.eventId) {
    params.set("eventId", filters.eventId);
  }

  if (filters.week) {
    params.set("week", filters.week);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function weekLabel(week: AttendeeWeekOption) {
  const attendeeLabel = week.count === 1 ? "attendee" : "attendees";

  return `${formatWeekRange(week.startIso, week.endIso)} (${week.count} ${attendeeLabel})`;
}

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const data = await getAttendeesDashboard({
    eventId: singleValue(query.eventId),
    week: singleValue(query.week),
  });
  const hasFilters = Boolean(data.filters.eventId || data.filters.week);
  const exportHref = buildAttendeesUrl("/attendees/export", data.filters);
  const selectedWeekInOptions = data.weeks.some(
    (week) => week.value === data.filters.week,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">Attendees</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Review submitted attendee details for{" "}
            <span className="font-medium text-zinc-950">{data.shop}</span> and
            export the current view for Agorify.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          href={exportHref}
        >
          Export CSV
        </Link>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]"
          method="get"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Event
            <select
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
              defaultValue={data.filters.eventId ?? ""}
              name="eventId"
            >
              <option value="">All events</option>
              {data.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Submission week
            <select
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
              defaultValue={data.filters.week ?? ""}
              name="week"
            >
              <option value="">All weeks</option>
              {data.filters.week && !selectedWeekInOptions ? (
                <option value={data.filters.week}>
                  {formatWeekValue(data.filters.week)}
                </option>
              ) : null}
              {data.weeks.map((week) => (
                <option key={week.value} value={week.value}>
                  {weekLabel(week)}
                </option>
              ))}
            </select>
          </label>

          <button
            className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 lg:self-end"
            type="submit"
          >
            Apply filters
          </button>

          {hasFilters ? (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 lg:self-end"
              href="/attendees"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Submitted attendee details
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {data.attendees.length}{" "}
              {data.attendees.length === 1 ? "attendee" : "attendees"} in the
              current view.
            </p>
          </div>
        </div>

        {data.attendees.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-600">
            {hasFilters
              ? "No submitted attendees match these filters."
              : "No attendees have submitted their details yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Attendee</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Badge</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.attendees.map((attendee) => (
                  <tr key={attendee.id}>
                    <td className="px-5 py-4 font-medium text-zinc-950">
                      {attendee.name}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {attendee.email}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {attendee.affiliation ?? "Not provided"}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {attendee.title ?? "Not provided"}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {attendee.badgeType ??
                        attendee.ticket?.productTitle ??
                        "Ticket"}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {attendee.event?.name ?? "Unmapped event"}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {attendee.order?.name ??
                        attendee.order?.number ??
                        "Order"}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      <span className="block">
                        {formatDateTime(attendee.claimedAt)}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        Week of {formatWeekValue(attendee.week)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
