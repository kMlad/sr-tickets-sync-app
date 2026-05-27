import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  cardClass,
  cardHeaderClass,
  h2Class,
  labelClass,
  selectClass,
  subtleTextClass,
  tableClass,
  tableTbodyClass,
  tableTdClass,
  tableTdMetaClass,
  tableTdPrimaryClass,
  tableThClass,
  tableTheadClass,
} from "@/components/ui/classes";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  type AttendeeWeekOption,
  getAttendeesDashboard,
} from "@/lib/tickets/attendees";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 31_536_000 },
    { unit: "month", seconds: 2_592_000 },
    { unit: "week", seconds: 604_800 },
    { unit: "day", seconds: 86_400 },
    { unit: "hour", seconds: 3_600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return formatter.format(0, "second");
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
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <section className="animate-rise flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel tone="dark">Roster</SectionLabel>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-cream">
            <span className="text-gradient">Attendees</span>
          </h1>
          <p className={`mt-3 max-w-2xl ${subtleTextClass}`}>
            Review submitted attendee details for{" "}
            <span className="font-medium text-cream">{data.shop}</span> and
            export the current view for Agorify.
          </p>
        </div>
        <ButtonLink href={exportHref} size="md">
          Export CSV
        </ButtonLink>
      </section>

      <section className={`${cardClass} p-5`}>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]"
          method="get"
        >
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Event</span>
            <select
              className={selectClass}
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

          <label className="flex flex-col gap-2">
            <span className={labelClass}>Submission week</span>
            <select
              className={selectClass}
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

          <Button className="lg:self-end" type="submit">
            Apply filters
          </Button>

          {hasFilters ? (
            <ButtonLink
              className="lg:self-end"
              href="/attendees"
              variant="secondary"
            >
              Clear
            </ButtonLink>
          ) : null}
        </form>
      </section>

      <section className={cardClass}>
        <div className={cardHeaderClass}>
          <div>
            <h2 className={h2Class}>Submitted attendee details</h2>
            <p className="mt-1 text-sm text-cream/60">
              {data.attendees.length}{" "}
              {data.attendees.length === 1 ? "attendee" : "attendees"} in the
              current view.
            </p>
          </div>
        </div>

        {data.attendees.length === 0 ? (
          <p className="px-6 py-8 text-sm text-cream/60">
            {hasFilters
              ? "No submitted attendees match these filters."
              : "No attendees have submitted their details yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead className={tableTheadClass}>
                <tr>
                  <th className={tableThClass}>Attendee</th>
                  <th className={tableThClass}>Email</th>
                  <th className={tableThClass}>Company</th>
                  <th className={tableThClass}>Title</th>
                  <th className={tableThClass}>Badge</th>
                  <th className={tableThClass}>Event</th>
                  <th className={tableThClass}>Order</th>
                  <th className={`${tableThClass} text-right`}>Submitted</th>
                </tr>
              </thead>
              <tbody className={tableTbodyClass}>
                {data.attendees.map((attendee) => (
                  <tr
                    className="transition-colors hover:bg-cream/[0.02]"
                    key={attendee.id}
                  >
                    <td className={tableTdPrimaryClass}>{attendee.name}</td>
                    <td className={tableTdClass}>{attendee.email}</td>
                    <td className={tableTdClass}>
                      {attendee.affiliation ?? (
                        <span className="text-cream/35">—</span>
                      )}
                    </td>
                    <td className={tableTdClass}>
                      {attendee.title ?? (
                        <span className="text-cream/35">—</span>
                      )}
                    </td>
                    <td className={tableTdClass}>
                      {attendee.badgeType ??
                        attendee.ticket?.productTitle ??
                        "Ticket"}
                    </td>
                    <td className={tableTdClass}>
                      {attendee.event?.name ?? "Unmapped event"}
                    </td>
                    <td className={tableTdClass}>
                      {attendee.order?.name ??
                        attendee.order?.number ??
                        "Order"}
                    </td>
                    <td className={`${tableTdMetaClass} text-right`}>
                      <span className="block">
                        {formatRelativeTime(attendee.claimedAt)}
                      </span>
                      <span className="mt-1 block text-[10px] text-cream/40">
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
    </Container>
  );
}
