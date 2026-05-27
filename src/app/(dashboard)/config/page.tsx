import {
  createEvent,
  deleteTicketProductMapping,
  saveTicketProductMapping,
} from "@/app/(dashboard)/config/actions";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  cardClass,
  cardHeaderClass,
  h2Class,
  infoMessageClass,
  inputClass,
  labelClass,
  selectClass,
  statusBadgeClass,
  subtleTextClass,
  tableClass,
  tableTbodyClass,
  tableTdClass,
  tableTdNumClass,
  tableTdPrimaryClass,
  tableThClass,
  tableTheadClass,
} from "@/components/ui/classes";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getTicketConfig } from "@/lib/tickets/config";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusMessage(status: string | undefined) {
  switch (status) {
    case "event-created":
      return "Event created.";
    case "event-invalid":
      return "Enter a valid event name.";
    case "mapping-saved":
      return "Ticket product mapping saved.";
    case "mapping-deleted":
      return "Ticket product mapping removed.";
    case "mapping-invalid":
      return "Choose an event and enter a numeric Shopify product ID.";
    default:
      return null;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [config, query] = await Promise.all([getTicketConfig(), searchParams]);
  const message = statusMessage(singleValue(query.status));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <section className="animate-rise">
        <SectionLabel tone="dark">Setup</SectionLabel>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-cream">
          <span className="text-gradient">Configuration</span>
        </h1>
        <p className={`mt-3 max-w-2xl ${subtleTextClass}`}>
          Map Shopify ticket products to Startup Rev events for{" "}
          <span className="font-medium text-cream">{config.shop}</span>.
        </p>
      </section>

      {message ? <p className={infoMessageClass}>{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>Create event</h2>
          <form action={createEvent} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className={labelClass}>Event name</span>
              <input className={inputClass} name="name" required type="text" />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>Start date</span>
              <input
                className={inputClass}
                name="startsAt"
                type="datetime-local"
              />
            </label>

            <Button type="submit">Create event</Button>
          </form>
        </section>

        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>Map ticket product</h2>
          <form
            action={saveTicketProductMapping}
            className="mt-5 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2">
              <span className={labelClass}>Event</span>
              <select
                className={selectClass}
                disabled={config.events.length === 0}
                name="eventId"
                required
              >
                <option value="">Select an event</option>
                {config.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>Shopify product ID</span>
              <input
                className={inputClass}
                inputMode="numeric"
                name="shopifyProductId"
                pattern="[0-9]+"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>Product title</span>
              <input className={inputClass} name="productTitle" type="text" />
            </label>

            <Button disabled={config.events.length === 0} type="submit">
              Save mapping
            </Button>
          </form>
        </section>
      </div>

      <section className={cardClass}>
        <div className={cardHeaderClass}>
          <h2 className={h2Class}>Current mappings</h2>
        </div>

        {config.mappings.length === 0 ? (
          <p className="px-6 py-8 text-sm text-cream/60">
            No Shopify products are mapped to events yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead className={tableTheadClass}>
                <tr>
                  <th className={tableThClass}>Product</th>
                  <th className={`${tableThClass} text-right`}>Shopify ID</th>
                  <th className={tableThClass}>Event</th>
                  <th className={`${tableThClass} text-right`}>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tableTbodyClass}>
                {config.mappings.map((mapping) => (
                  <tr
                    className="transition-colors hover:bg-cream/[0.02]"
                    key={mapping.id}
                  >
                    <td className={tableTdPrimaryClass}>
                      {mapping.productTitle ?? "Ticket product"}
                    </td>
                    <td className={tableTdNumClass}>
                      {mapping.shopifyProductId}
                    </td>
                    <td className={tableTdClass}>{mapping.eventName}</td>
                    <td className="px-6 py-4 align-middle text-right">
                      <form action={deleteTicketProductMapping}>
                        <input
                          name="mappingId"
                          type="hidden"
                          value={mapping.id}
                        />
                        <Button size="sm" type="submit" variant="secondary">
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className={cardHeaderClass}>
          <h2 className={h2Class}>Events</h2>
        </div>

        {config.events.length === 0 ? (
          <p className="px-6 py-8 text-sm text-cream/60">
            Create an event before mapping products.
          </p>
        ) : (
          <div className="divide-y divide-cream/5">
            {config.events.map((event) => (
              <div
                className="flex flex-col gap-2 px-6 py-5 transition-colors hover:bg-cream/[0.02] sm:flex-row sm:items-center sm:justify-between"
                key={event.id}
              >
                <div>
                  <p className="font-medium text-cream">{event.name}</p>
                  <p className="mt-1 font-mono text-xs text-cream/55">
                    {formatDate(event.startsAt)}
                  </p>
                </div>
                <span className={statusBadgeClass(event.status)}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
