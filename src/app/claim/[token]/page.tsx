import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  errorMessageClass,
  inputClass,
  labelClass,
  successMessageClass,
} from "@/components/ui/classes";
import { SectionLabel } from "@/components/ui/SectionLabel";
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
    return "Enter the required attendee details and a valid email address.";
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
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      affiliation: formData.get("affiliation"),
      title: formData.get("title"),
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
    <main className="relative flex min-h-screen items-start justify-center overflow-hidden bg-void px-4 py-12 text-cream">
      <div className="gradient-brand-radial pointer-events-none absolute -top-1/3 left-1/2 h-[820px] w-[820px] -translate-x-1/2 opacity-50" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <section className="animate-rise relative mx-auto flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col items-center text-center">
          <Image
            alt="Startup Rev"
            className="mb-6 h-8 w-auto"
            height={32}
            priority
            src="/sr-summit-logo-for-dark.svg"
            width={160}
          />
          <SectionLabel tone="dark">Ticket Assignment</SectionLabel>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
            <span className="text-gradient">Claim your seat</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-cream/10 bg-ash/60 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="border-b border-cream/10 pb-5">
            <p className={labelClass}>Event</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-cream">
              {claimDetails.event?.name ?? "Event ticket"}
            </h2>
            {eventDate ? (
              <p className="mt-2 font-mono text-xs text-cream/65">
                {eventDate}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-cream/70">
              {claimDetails.ticket.productTitle ?? "Ticket"}
              {claimDetails.order?.name ? ` · ${claimDetails.order.name}` : ""}
            </p>
          </div>

          {isAssigned ? (
            <div className="pt-5">
              <p className={successMessageClass}>Ticket assigned</p>
              {claimDetails.attendee ? (
                <div className="mt-5 grid gap-4 text-sm">
                  <div>
                    <p className={labelClass}>Attendee</p>
                    <p className="mt-1 text-cream">
                      {claimDetails.attendee.name}
                    </p>
                  </div>
                  {claimDetails.attendee.affiliation ? (
                    <div>
                      <p className={labelClass}>Company</p>
                      <p className="mt-1 text-cream">
                        {claimDetails.attendee.affiliation}
                      </p>
                    </div>
                  ) : null}
                  {claimDetails.attendee.title ? (
                    <div>
                      <p className={labelClass}>Position at company</p>
                      <p className="mt-1 text-cream">
                        {claimDetails.attendee.title}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <p className={labelClass}>Email</p>
                    <p className="mt-1 text-cream">
                      {claimDetails.attendee.email}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <form action={submitClaim} className="flex flex-col gap-4 pt-5">
              {message ? <p className={errorMessageClass}>{message}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>First name</span>
                  <input
                    autoComplete="given-name"
                    className={inputClass}
                    name="firstName"
                    required
                    type="text"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className={labelClass}>Last name</span>
                  <input
                    autoComplete="family-name"
                    className={inputClass}
                    name="lastName"
                    required
                    type="text"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Email</span>
                <input
                  autoComplete="email"
                  className={inputClass}
                  name="email"
                  required
                  type="email"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Company</span>
                <input
                  autoComplete="organization"
                  className={inputClass}
                  name="affiliation"
                  required
                  type="text"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Position at company</span>
                <input
                  autoComplete="organization-title"
                  className={inputClass}
                  name="title"
                  required
                  type="text"
                />
              </label>

              <Button className="mt-2 w-full" size="lg" type="submit">
                Assign ticket
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
