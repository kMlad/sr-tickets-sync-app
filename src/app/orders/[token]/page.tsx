import { notFound, redirect } from "next/navigation";
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

function statusClass(status: string) {
  if (status === "assigned") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
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
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-zinc-500">Startup Rev</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Manage attendees
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            {orderDetails.order.name ?? "Ticket order"}
            {orderDetails.order.buyerEmail
              ? ` for ${orderDetails.order.buyerEmail}`
              : ""}
          </p>
        </div>

        {message ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        ) : null}

        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-base font-semibold">Tickets</h2>
          </div>

          <div className="divide-y divide-zinc-200">
            {orderDetails.tickets.map((ticket, index) => {
              const eventDate = formatDate(ticket.event?.startsAt ?? null);
              const sent = sentTicketId === ticket.id;
              const canInvite = ticket.status === "unassigned";

              return (
                <article className="grid gap-4 p-5" key={ticket.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-500">
                        Ticket {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {ticket.productTitle ?? "Ticket"}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {ticket.event?.name ?? "Event ticket"}
                        {eventDate ? ` · ${eventDate}` : ""}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium ${statusClass(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  {ticket.attendee ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Assigned to {ticket.attendee.name}{" "}
                      <span>({ticket.attendee.email})</span>
                    </div>
                  ) : canInvite ? (
                    <form
                      action={sendInvite}
                      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <input name="ticketId" type="hidden" value={ticket.id} />
                      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
                        Attendee email
                        <input
                          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                          defaultValue={ticket.invitedEmail ?? ""}
                          name="email"
                          required
                          type="email"
                        />
                      </label>
                      <button
                        className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        type="submit"
                      >
                        Send link
                      </button>
                    </form>
                  ) : (
                    <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                      This ticket cannot receive invites.
                    </p>
                  )}

                  {sent ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Invite sent.
                    </p>
                  ) : ticket.invitedEmail && ticket.invitationSentAt ? (
                    <p className="text-sm text-zinc-500">
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
