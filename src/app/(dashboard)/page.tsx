import { getRecentTickets } from "@/lib/tickets/dashboard";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "assigned") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export default function DashboardPage() {
  const ticketsPromise = getRecentTickets();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-950">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Ticket sync workflow.
        </p>
      </section>

      <RecentTickets ticketsPromise={ticketsPromise} />
    </main>
  );
}

async function RecentTickets({
  ticketsPromise,
}: {
  ticketsPromise: ReturnType<typeof getRecentTickets>;
}) {
  const tickets = await ticketsPromise;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-950">
          Recent tickets
        </h2>
      </div>

      {tickets.length === 0 ? (
        <p className="px-5 py-6 text-sm text-zinc-600">
          No ticket instances have been synced yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Ticket</th>
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Claim link</th>
                <th className="px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-5 py-4 font-medium text-zinc-950">
                    {ticket.productTitle ?? "Ticket"}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {ticket.eventName ?? "Unmapped event"}
                  </td>
                  <td className="px-5 py-4 text-zinc-700">
                    {ticket.orderName ?? "Order"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusClass(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="max-w-xs px-5 py-4">
                    <a
                      className="block truncate font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-950"
                      href={ticket.claimUrl}
                    >
                      {ticket.claimUrl}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {formatDate(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
