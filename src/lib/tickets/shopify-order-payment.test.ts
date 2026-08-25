import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { hasSuccessfulShopifyPayment } from "./shopify-order-payment";

describe("Shopify order payment status", () => {
  test("accepts a paid order", () => {
    assert.equal(hasSuccessfulShopifyPayment("paid"), true);
    assert.equal(hasSuccessfulShopifyPayment("PAID"), true);
  });

  test("rejects orders that have not been fully paid", () => {
    assert.equal(hasSuccessfulShopifyPayment("pending"), false);
    assert.equal(hasSuccessfulShopifyPayment("authorized"), false);
    assert.equal(hasSuccessfulShopifyPayment("partially_paid"), false);
    assert.equal(hasSuccessfulShopifyPayment(null), false);
  });
});
