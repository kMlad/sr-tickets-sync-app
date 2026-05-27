import { notFound, redirect } from "next/navigation";
import {
  claimTicket,
  claimTicketInputSchema,
  getTicketClaimDetails,
} from "@/lib/tickets/claims";

export const dynamic = "force-dynamic";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatEventDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(error: string | undefined) {
  if (error === "already_claimed") {
    return "This ticket has already been assigned.";
  }

  if (error === "invalid") {
    return "Enter your name and a valid email address.";
  }

  return null;
}

export default async function ClaimTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const claimDetails = await getTicketClaimDetails(token);

  if (!claimDetails) {
    notFound();
  }

  const message = errorMessage(singleValue(query.error));
  const eventDate = formatEventDate(claimDetails.event?.startsAt ?? null);

  async function submitClaim(formData: FormData) {
    "use server";

    const parsed = claimTicketInputSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
    });

    if (!parsed.success) {
      redirect(`/claim/${encodeURIComponent(token)}?error=invalid`);
    }

    const result = await claimTicket(token, parsed.data);

    if ("error" in result) {
      redirect(`/claim/${encodeURIComponent(token)}?error=${result.error}`);
    }

    redirect(`/claim/${encodeURIComponent(token)}?claimed=1`);
  }

  const isAssigned = claimDetails.ticket.status === "assigned";

  return (
    <main className="flex min-h-screen bg-zinc-100 px-4 py-10 text-zinc-950">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-zinc-500">Startup Rev</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Ticket assignment
          </h1>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="border-b border-zinc-200 pb-5">
            <p className="text-sm font-medium text-zinc-500">Event</p>
            <h2 className="mt-1 text-xl font-semibold">
              {claimDetails.event?.name ?? "Event ticket"}
            </h2>
            {eventDate ? (
              <p className="mt-2 text-sm text-zinc-600">{eventDate}</p>
            ) : null}
            <p className="mt-4 text-sm text-zinc-600">
              {claimDetails.ticket.productTitle ?? "Ticket"}
              {claimDetails.order?.name ? ` · ${claimDetails.order.name}` : ""}
            </p>
          </div>

          {isAssigned ? (
            <div className="pt-5">
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                Ticket assigned
              </p>
              {claimDetails.attendee ? (
                <div className="mt-5 grid gap-3 text-sm">
                  <div>
                    <p className="font-medium text-zinc-500">Attendee</p>
                    <p className="mt-1 text-zinc-950">
                      {claimDetails.attendee.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-500">Email</p>
                    <p className="mt-1 text-zinc-950">
                      {claimDetails.attendee.email}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <form action={submitClaim} className="flex flex-col gap-4 pt-5">
              {message ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {message}
                </p>
              ) : null}

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
                Full name
                <input
                  className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                  name="name"
                  required
                  type="text"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
                Email
                <input
                  className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                  name="email"
                  required
                  type="email"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
                Phone
                <input
                  className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
                  name="phone"
                  type="tel"
                />
              </label>

              <button
                className="mt-2 h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                type="submit"
              >
                Assign ticket
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
