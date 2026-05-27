import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  errorMessageClass,
  inputClass,
  labelClass,
  statusBadgeClass,
  successMessageClass,
} from "@/components/ui/classes";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  getManagedOrderDetails,
  sendTicketInvite,
  sendTicketInviteInputSchema,
} from "@/lib/tickets/order-management";

export const dynamic = "force-dynamic";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function pageMessage(error: string | undefined) {
  if (error === "invalid") {
    return "Enter a valid attendee email address.";
  }

  if (error === "already_assigned") {
    return "That ticket has already been assigned.";
  }

  if (error === "email_failed") {
    return "The email could not be sent. Try again in a moment.";
  }

  return null;
}

export default async function ManageOrderTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const orderDetails = await getManagedOrderDetails(token);

  if (!orderDetails) {
    notFound();
  }

  const message = pageMessage(singleValue(query.error));
  const sentTicketId = singleValue(query.sent);

  async function sendInvite(formData: FormData) {
    "use server";

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-void px-4 py-12 text-cream">
      <div className="gradient-brand-radial pointer-events-none absolute -top-1/3 left-1/2 h-[820px] w-[820px] -translate-x-1/2 opacity-40" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <section className="animate-rise relative mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center text-center">
          <Image
            alt="Startup Rev"
            className="mb-6 h-8 w-auto"
            height={32}
            priority
            src="/sr-summit-logo-for-dark.svg"
            width={160}
          />
          <SectionLabel tone="dark">Order Management</SectionLabel>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
            <span className="text-gradient">Manage attendees</span>
          </h1>
          <p className="mt-3 text-sm text-cream/65">
            {orderDetails.order.name ?? "Ticket order"}
            {orderDetails.order.buyerEmail
              ? ` for ${orderDetails.order.buyerEmail}`
              : ""}
          </p>
        </div>

        {message ? <p className={errorMessageClass}>{message}</p> : null}

        <div className="rounded-2xl border border-cream/10 bg-ash/60 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="border-b border-cream/10 px-6 py-5">
            <h2 className="font-display text-lg font-semibold text-cream">
              Tickets
            </h2>
          </div>

          <div className="divide-y divide-cream/10">
            {orderDetails.tickets.map((ticket, index) => {
              const eventDate = formatDate(ticket.event?.startsAt ?? null);
              const sent = sentTicketId === ticket.id;
              const canInvite = ticket.status === "unassigned";

              return (
                <article className="grid gap-4 p-6" key={ticket.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={labelClass}>Ticket {index + 1}</p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-cream">
                        {ticket.productTitle ?? "Ticket"}
                      </h3>
                      <p className="mt-1 text-sm text-cream/65">
                        {ticket.event?.name ?? "Event ticket"}
                        {eventDate ? ` · ${eventDate}` : ""}
                      </p>
                    </div>
                    <span className={statusBadgeClass(ticket.status)}>
                      {ticket.status}
                    </span>
                  </div>

                  {ticket.attendee ? (
                    <div className="rounded-md border border-forest/30 bg-forest/10 px-3 py-2 text-sm text-forest">
                      <p>
                        Assigned to {ticket.attendee.name}{" "}
                        <span>({ticket.attendee.email})</span>
                      </p>
                      {ticket.attendee.title || ticket.attendee.affiliation ? (
                        <p className="mt-1 text-forest/80">
                          {[ticket.attendee.title, ticket.attendee.affiliation]
                            .filter(Boolean)
                            .join(" at ")}
                        </p>
                      ) : null}
                    </div>
                  ) : canInvite ? (
                    <form
                      action={sendInvite}
                      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <input name="ticketId" type="hidden" value={ticket.id} />
                      <label className="flex flex-col gap-2">
                        <span className={labelClass}>Attendee email</span>
                        <input
                          className={inputClass}
                          defaultValue={ticket.invitedEmail ?? ""}
                          name="email"
                          required
                          type="email"
                        />
                      </label>
                      <Button type="submit">Send link</Button>
                    </form>
                  ) : (
                    <p className="rounded-md border border-cream/10 bg-cream/[0.04] px-3 py-2 text-sm text-cream/60">
                      This ticket cannot receive invites.
                    </p>
                  )}

                  {sent ? (
                    <p className={successMessageClass}>Invite sent.</p>
                  ) : ticket.invitedEmail && ticket.invitationSentAt ? (
                    <p className="font-mono text-xs text-cream/50">
                      Last sent to {ticket.invitedEmail} on{" "}
                      {formatDate(ticket.invitationSentAt)}.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
