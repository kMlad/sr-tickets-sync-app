import {
  createEvent,
  deleteTicketProductMapping,
  saveTicketProductMapping,
} from "@/app/(dashboard)/config/actions";
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-950">Configuration</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Map Shopify ticket products to Startup Rev events for{" "}
          <span className="font-medium text-zinc-950">{config.shop}</span>.
        </p>
      </section>

      {message ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-950">
            Create event
          </h2>
          <form action={createEvent} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Event name
              <input
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                name="name"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Start date
              <input
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                name="startsAt"
                type="datetime-local"
              />
            </label>

            <button
              className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              type="submit"
            >
              Create event
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-950">
            Map ticket product
          </h2>
          <form
            action={saveTicketProductMapping}
            className="mt-5 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Event
              <select
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
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

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Shopify product ID
              <input
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                inputMode="numeric"
                name="shopifyProductId"
                pattern="[0-9]+"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
              Product title
              <input
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                name="productTitle"
                type="text"
              />
            </label>

            <button
              className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={config.events.length === 0}
              type="submit"
            >
              Save mapping
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-950">
            Current mappings
          </h2>
        </div>

        {config.mappings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-600">
            No Shopify products are mapped to events yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Shopify ID</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {config.mappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td className="px-5 py-4 font-medium text-zinc-950">
                      {mapping.productTitle ?? "Ticket product"}
                    </td>
                    <td className="px-5 py-4 font-mono text-zinc-700">
                      {mapping.shopifyProductId}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {mapping.eventName}
                    </td>
                    <td className="px-5 py-4">
                      <form action={deleteTicketProductMapping}>
                        <input
                          name="mappingId"
                          type="hidden"
                          value={mapping.id}
                        />
                        <button
                          className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                          type="submit"
                        >
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-950">Events</h2>
        </div>

        {config.events.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-600">
            Create an event before mapping products.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {config.events.map((event) => (
              <div
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={event.id}
              >
                <div>
                  <p className="font-medium text-zinc-950">{event.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {formatDate(event.startsAt)}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
