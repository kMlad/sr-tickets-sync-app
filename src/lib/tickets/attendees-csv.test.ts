import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  AGORIFY_ATTENDEE_CSV_HEADERS,
  buildAgorifyAttendeesCsv,
} from "./attendees-csv";

describe("buildAgorifyAttendeesCsv", () => {
  test("exports attendees as on-site", () => {
    const csv = buildAgorifyAttendeesCsv([
      {
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        attendeeType: "attendee",
        affiliation: null,
        title: null,
        badgeType: null,
        phone: null,
        addedInAgorify: false,
      },
    ]);

    const [header, row] = csv.split("\r\n");

    assert.equal(header, AGORIFY_ATTENDEE_CSV_HEADERS.join(","));
    assert.equal(row?.split(",").length, AGORIFY_ATTENDEE_CSV_HEADERS.length);
    assert.equal(row?.split(",").at(-1), "on-site");
  });

  test("exports media passes as Agorify attendee type with a Media badge", () => {
    const csv = buildAgorifyAttendeesCsv([
      {
        email: "press@example.com",
        firstName: "Nellie",
        lastName: "Bly",
        attendeeType: "attendee",
        affiliation: "The World",
        title: "Journalist",
        badgeType: "Media",
        phone: null,
        addedInAgorify: false,
      },
    ]);

    const row = csv.split("\r\n")[1];
    const columns = row?.split(",");

    assert.equal(columns?.[3], "attendee");
    assert.equal(columns?.[6], "Media");
  });

  test("does not export attendees already added to Agorify", () => {
    const csv = buildAgorifyAttendeesCsv([
      {
        email: "grace@example.com",
        firstName: "Grace",
        lastName: "Hopper",
        attendeeType: "attendee",
        affiliation: null,
        title: null,
        badgeType: null,
        phone: null,
        addedInAgorify: true,
      },
    ]);

    assert.equal(csv, AGORIFY_ATTENDEE_CSV_HEADERS.join(","));
  });
});
