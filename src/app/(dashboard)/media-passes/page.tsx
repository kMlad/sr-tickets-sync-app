import Link from "next/link";
import { issueMediaPassBatch } from "@/app/(dashboard)/media-passes/actions";
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
import {
  getMediaPassesDashboard,
  MEDIA_PASS_MAX_QUANTITY,
} from "@/lib/tickets/media-passes";

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusMessage(status: string | undefined) {
  switch (status) {
    case "issued":
      return "Media passes issued. An assignment email is on its way.";
    case "issued-email-failed":
      return "Media passes were created, but the assignment email could not be sent.";
    default:
      return null;
  }
}

function errorMessage(error: string | undefined) {
  switch (error) {
    case "invalid":
      return "Enter a valid email and a pass count between 1 and 50.";
    case "invalid_quantity":
      return "Enter a pass count between 1 and 50.";
    case "pass_type_not_found":
      return "That media pass type is no longer available. Add one in Config.";
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

export default async function MediaPassesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [data, query] = await Promise.all([
    getMediaPassesDashboard(),
    searchParams,
  ]);
  const success = statusMessage(singleValue(query.status));
  const failure = errorMessage(singleValue(query.error));
  const hasPassTypes = data.passTypes.length > 0;
  const singlePassType = data.passTypes.length === 1 ? data.passTypes[0] : null;

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <section className="animate-rise">
        <SectionLabel tone="dark">Media passes</SectionLabel>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-cream">
          <span className="text-gradient">Issue media passes</span>
        </h1>
        {data.currentEvent ? (
          <p className={`mt-3 max-w-2xl ${subtleTextClass}`}>
            Issuing complimentary media passes for{" "}
            <span className="font-medium text-cream">
              {data.currentEvent.name}
            </span>{" "}
            ({formatDate(data.currentEvent.startsAt)}). The recipient gets a
            link to assign each pass, the same way a Shopify buyer distributes
            multiple tickets.{" "}
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
            Media passes are issued for the current event.
          </p>
        )}
      </section>

      {success ? <p className={successMessageClass}>{success}</p> : null}
      {failure ? <p className={errorMessageClass}>{failure}</p> : null}

      {!data.currentEvent ? (
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>No current event</h2>
          <p className={`mt-2 ${subtleTextClass}`}>
            Pick the event these media passes belong to before issuing any.
          </p>
          <ButtonLink className="mt-5" href="/config">
            Go to Config
          </ButtonLink>
        </section>
      ) : !hasPassTypes ? (
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>No media pass type</h2>
          <p className={`mt-2 ${subtleTextClass}`}>
            Define a media ticket type for {data.currentEvent.name} — for
            example &ldquo;Media&rdquo;. Agorify imports that name as the badge
            type.
          </p>
          <ButtonLink className="mt-5" href="/config">
            Add a pass type
          </ButtonLink>
        </section>
      ) : (
        <section className={`${cardClass} p-6`}>
          <h2 className={h2Class}>Pass details</h2>
          <p className="mt-2 text-sm text-cream/60">
            Unassigned passes are created immediately. The email you enter
            receives a private link to distribute them.
          </p>

          <form
            action={issueMediaPassBatch}
            className="mt-5 grid gap-4 sm:grid-cols-2"
            key={singleValue(query.status) ?? singleValue(query.error) ?? "new"}
          >
            {singlePassType ? (
              <input
                name="passTypeId"
                type="hidden"
                value={singlePassType.id}
              />
            ) : (
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
            )}

            <label className="flex flex-col gap-2">
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
              <span className={labelClass}>Number of passes</span>
              <input
                className={inputClass}
                max={MEDIA_PASS_MAX_QUANTITY}
                min={1}
                name="quantity"
                required
                type="number"
                defaultValue={1}
              />
            </label>

            <div className="sm:col-span-2">
              <SubmitButton>Issue passes</SubmitButton>
            </div>
          </form>
        </section>
      )}

      {data.currentEvent ? (
        <section className={cardClass}>
          <div className={cardHeaderClass}>
            <div>
              <h2 className={h2Class}>Recently issued</h2>
              <p className="mt-1 text-sm text-cream/60">
                Media pass batches for {data.currentEvent.name}.
              </p>
            </div>
            <ButtonLink href="/attendees" size="sm" variant="secondary">
              View full roster
            </ButtonLink>
          </div>

          {data.batches.length === 0 ? (
            <p className="px-6 py-8 text-sm text-cream/60">
              No media passes have been issued for this event yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead className={tableTheadClass}>
                  <tr>
                    <th className={tableThClass}>Email</th>
                    <th className={tableThClass}>Passes</th>
                    <th className={tableThClass}>Assigned</th>
                    <th className={tableThClass}>Notification</th>
                    <th className={`${tableThClass} text-right`}>Issued</th>
                  </tr>
                </thead>
                <tbody className={tableTbodyClass}>
                  {data.batches.map((batch) => (
                    <tr
                      className="transition-colors hover:bg-cream/[0.02]"
                      key={batch.id}
                    >
                      <td className={tableTdPrimaryClass}>
                        {batch.email ?? (
                          <span className="text-cream/35">—</span>
                        )}
                      </td>
                      <td className={tableTdClass}>{batch.ticketCount}</td>
                      <td className={tableTdClass}>
                        {batch.assignedCount}/{batch.ticketCount}
                      </td>
                      <td className={tableTdClass}>
                        {batch.notificationSentAt ? (
                          <a
                            className="text-cream/80 underline decoration-cream/15 underline-offset-4 transition-colors hover:text-orange hover:decoration-orange"
                            href={batch.manageUrl}
                          >
                            Sent
                          </a>
                        ) : (
                          <a
                            className="text-cream/80 underline decoration-cream/15 underline-offset-4 transition-colors hover:text-orange hover:decoration-orange"
                            href={batch.manageUrl}
                          >
                            Not sent
                          </a>
                        )}
                      </td>
                      <td className={`${tableTdMetaClass} text-right`}>
                        {formatDate(batch.issuedAt)}
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
