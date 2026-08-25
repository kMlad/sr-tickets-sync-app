import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { includesMarathonRegistration } from "./marathon-registration";

describe("Wizz Air Skopje Marathon registration", () => {
  test("includes the benefit for an attendee with a paid ticket", () => {
    assert.equal(
      includesMarathonRegistration({
        financialStatus: "paid",
        passTypeCategory: "paid",
        price: "0.00",
      }),
      true,
    );
  });

  test("excludes attendees with free tickets", () => {
    assert.equal(
      includesMarathonRegistration({
        financialStatus: "paid",
        passTypeCategory: "free",
        price: "249.00",
      }),
      false,
    );
  });

  test("excludes tickets on orders that have not been paid", () => {
    assert.equal(
      includesMarathonRegistration({
        financialStatus: "pending",
        passTypeCategory: "paid",
        price: "249.00",
      }),
      false,
    );
  });

  test("supports paid legacy tickets without a pass type", () => {
    assert.equal(
      includesMarathonRegistration({
        financialStatus: "paid",
        passTypeCategory: null,
        price: "249.00",
      }),
      true,
    );
  });
});
