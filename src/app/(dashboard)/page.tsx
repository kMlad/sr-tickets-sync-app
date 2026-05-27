import { Container } from "@/components/ui/Container";
import {
  cardClass,
  cardHeaderClass,
  h2Class,
  statusBadgeClass,
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
import { getRecentTickets } from "@/lib/tickets/dashboard";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const ticketsPromise = getRecentTickets();

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <section className="animate-rise">
        <SectionLabel tone="dark">Overview</SectionLabel>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-cream">
          <span className="text-gradient">Dashboard</span>
        </h1>
        <p className={`mt-3 max-w-2xl ${subtleTextClass}`}>
          Ticket sync workflow.
        </p>
      </section>

      <RecentTickets ticketsPromise={ticketsPromise} />
    </Container>
  );
}

async function RecentTickets({
  ticketsPromise,
}: {
  ticketsPromise: ReturnType<typeof getRecentTickets>;
}) {
  const tickets = await ticketsPromise;

  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <h2 className={h2Class}>Recent tickets</h2>
      </div>

      {tickets.length === 0 ? (
        <p className="px-6 py-8 text-sm text-cream/60">
          No ticket instances have been synced yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={tableTheadClass}>
              <tr>
                <th className={tableThClass}>Ticket</th>
                <th className={tableThClass}>Event</th>
                <th className={tableThClass}>Order</th>
                <th className={tableThClass}>Status</th>
                <th className={tableThClass}>Claim link</th>
                <th className={`${tableThClass} text-right`}>Created</th>
              </tr>
            </thead>
            <tbody className={tableTbodyClass}>
              {tickets.map((ticket) => (
                <tr
                  className="transition-colors hover:bg-cream/[0.02]"
                  key={ticket.id}
                >
                  <td className={tableTdPrimaryClass}>
                    {ticket.productTitle ?? "Ticket"}
                  </td>
                  <td className={tableTdClass}>
                    {ticket.eventName ?? "Unmapped event"}
                  </td>
                  <td className={tableTdClass}>
                    {ticket.orderName ?? "Order"}
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <span className={statusBadgeClass(ticket.status)}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="max-w-[22rem] px-6 py-4 align-middle">
                    <a
                      className="block truncate font-mono text-xs text-cream/70 underline decoration-cream/15 underline-offset-4 transition-colors hover:decoration-orange hover:text-orange"
                      href={ticket.claimUrl}
                      title={ticket.claimUrl}
                    >
                      {ticket.claimUrl}
                    </a>
                  </td>
                  <td className={`${tableTdMetaClass} text-right`}>
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
