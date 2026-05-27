import { verifyAdminSession } from "@/lib/auth";
import {
  buildAgorifyAttendeesCsv,
  getAttendeesForExport,
} from "@/lib/tickets/attendees";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await verifyAdminSession();

  const url = new URL(request.url);
  const attendees = await getAttendeesForExport({
    eventId: url.searchParams.get("eventId"),
    week: url.searchParams.get("week"),
  });
  const csv = buildAgorifyAttendeesCsv(attendees);
  const filename = buildFilename(url.searchParams.get("week"));

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function buildFilename(week: string | null) {
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return `startup-rev-attendees-${week}.csv`;
  }

  return "startup-rev-attendees.csv";
}
