export const AGORIFY_ATTENDEE_CSV_HEADERS = [
  "email",
  "firstname",
  "lastname",
  "type",
  "affiliation",
  "title",
  "badgetype",
  "affiliationphonenumber",
  "attendeephonenumber",
  "attendeelocation",
] as const;

const AGORIFY_ATTENDEE_LOCATION = "on-site";

type AgorifyCsvAttendee = {
  email: string;
  firstName: string;
  lastName: string;
  attendeeType: string;
  affiliation: string | null;
  title: string | null;
  badgeType: string | null;
  phone: string | null;
  addedInAgorify: boolean;
};

export function buildAgorifyAttendeesCsv(attendees: AgorifyCsvAttendee[]) {
  const rows = attendees
    .filter((attendee) => !attendee.addedInAgorify)
    .map((attendee) => [
      attendee.email,
      attendee.firstName,
      attendee.lastName,
      attendee.attendeeType,
      attendee.affiliation ?? "",
      attendee.title ?? "",
      attendee.badgeType ?? "",
      "",
      attendee.phone ?? "",
      AGORIFY_ATTENDEE_LOCATION,
    ]);

  return [
    AGORIFY_ATTENDEE_CSV_HEADERS.join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");
}

function escapeCsvValue(value: string) {
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}
