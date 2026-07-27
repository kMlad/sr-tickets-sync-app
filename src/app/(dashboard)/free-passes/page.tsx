import Link from "next/link";
import { addFreePass } from "@/app/(dashboard)/free-passes/actions";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  cardClass,
  cardHeaderClass,
  errorMessageClass,
  h2Class,
  inputClass,
  labelClass,
  selectClass,
  subtleTextClass,
  successMessageClass,
  tableClass,
  tableTbodyClass,
  tableTdClass,
  tableTdMetaClass,
  tableTdPrimaryClass,
  tableThClass,
  tableTheadClass,
} from "@/components/ui/classes";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getFreePassesDashboard } from "@/lib/tickets/free-passes";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusMessage(status: string | undefined) {
  switch (status) {
    case "added":
      return "Attendee added. A confirmation email is on its way.";
    case "added-email-failed":
      return "Attendee added, but the confirmation email could not be sent.";
    default:
      return null;
  }
}

function errorMessage(error: string | undefined) {
  switch (error) {
    case "invalid":
      return "Fill in every field with valid details.";
    case "email_exists":
      return "Someone with that email is already registered for this event.";
    case "pass_type_not_found":
      return "That pass type is no longer available. Pick another one.";
    case "no_current_event":
      return "No current event is set. Choose one in Config first.";
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
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function FreePassesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [data, query] = await Promise.all([
    getFreePassesDashboard(),
    searchParams,
  ]);
  const success = statusMessage(singleValue(query.status));
  const failure = errorMessage(singleValue(query.error));
  const hasPassTypes = data.passTypes.length > 0;

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <section className="animate-rise">
        <SectionLabel tone="dark">Free passes</SectionLabel>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-cream">
          <span className="text-gradient">Add attendee</span>
        </h1>
        {data.currentEvent ? (
          <p className={`mt-3 max-w-2xl ${subtleTextClass}`}>
            Issuing free passes for{" "}
            <span className="font-medium text-cream">
              {data.currentEvent.name}
            </span>{" "}
            ({formatDate(data.currentEvent.startsAt)}).{" "}
            <Link
              className="text-orange underline underline-offset-4 hover:text-orange-hot"
              href="/config"
            >
              Change in Config
            </Link>
            .
          </p>
        ) : (
          <p className={`mt-3 max-w-2xl ${subtleTextClass}`}>
            Free passes are issued for the current event.
          </p>
        )}
      </section>

      {success ? <p className={successMessageClass}>{success}</p> : null}
      {failure ? <p className={errorMessageClass}>{failure}</p> : null}

      {!data.currentEvent ? (
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>No current event</h2>
          <p className={`mt-2 ${subtleTextClass}`}>
            Pick the event these attendees belong to before adding anyone.
          </p>
          <ButtonLink className="mt-5" href="/config">
            Go to Config
          </ButtonLink>
        </section>
      ) : !hasPassTypes ? (
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>No free pass types</h2>
          <p className={`mt-2 ${subtleTextClass}`}>
            Define at least one free pass type for {data.currentEvent.name} —
            for example &ldquo;Investor Pass&rdquo; or &ldquo;Ecosystem
            Pass&rdquo;.
          </p>
          <ButtonLink className="mt-5" href="/config">
            Add a pass type
          </ButtonLink>
        </section>
      ) : (
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>Attendee details</h2>
          <p className="mt-2 text-sm text-cream/60">
            The attendee is registered immediately and emailed a confirmation.
          </p>

          <form
            action={addFreePass}
            className="mt-5 grid gap-4 sm:grid-cols-2"
            key={singleValue(query.status) ?? singleValue(query.error) ?? "new"}
          >
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className={labelClass}>Pass type</span>
              <select className={selectClass} name="passTypeId" required>
                {data.passTypes.map((passType) => (
                  <option key={passType.id} value={passType.id}>
                    {passType.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>First name</span>
              <input
                autoComplete="off"
                className={inputClass}
                maxLength={80}
                name="firstName"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>Last name</span>
              <input
                autoComplete="off"
                className={inputClass}
                maxLength={80}
                name="lastName"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className={labelClass}>Email</span>
              <input
                autoComplete="off"
                className={inputClass}
                name="email"
                required
                type="email"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>Company</span>
              <input
                autoComplete="off"
                className={inputClass}
                maxLength={160}
                name="affiliation"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>Position at company</span>
              <input
                autoComplete="off"
                className={inputClass}
                maxLength={160}
                name="title"
                required
                type="text"
              />
            </label>

            <div className="sm:col-span-2">
              <SubmitButton>Add attendee</SubmitButton>
            </div>
          </form>
        </section>
      )}

      {data.currentEvent ? (
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <div>
              <h2 className={h2Class}>Recently added</h2>
              <p className="mt-1 text-sm text-cream/60">
                Free passes issued for {data.currentEvent.name}.
              </p>
            </div>
            <ButtonLink href="/attendees" size="sm" variant="secondary">
              View full roster
            </ButtonLink>
          </div>

          {data.attendees.length === 0 ? (
            <p className="px-6 py-8 text-sm text-cream/60">
              No free passes have been issued for this event yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead className={tableTheadClass}>
                  <tr>
                    <th className={tableThClass}>Attendee</th>
                    <th className={tableThClass}>Email</th>
                    <th className={tableThClass}>Company</th>
                    <th className={tableThClass}>Pass type</th>
                    <th className={`${tableThClass} text-right`}>
                      Confirmation
                    </th>
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
                        {attendee.badgeType ?? (
                          <span className="text-cream/35">—</span>
                        )}
                      </td>
                      <td className={`${tableTdMetaClass} text-right`}>
                        {attendee.confirmationSentAt ? "Sent" : "Not sent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </Container>
  );
}
