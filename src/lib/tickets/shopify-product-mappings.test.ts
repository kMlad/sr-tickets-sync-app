import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  findShopifyProductMapping,
  indexShopifyProductMappings,
  type ShopifyProductMapping,
} from "./shopify-product-mappings";

const productMapping: ShopifyProductMapping = {
  event_id: "event-product",
  shopify_product_id: "100",
  shopify_variant_id: null,
  pass_type_id: null,
  ticket_type_name: null,
};

const variantMapping: ShopifyProductMapping = {
  event_id: "event-variant",
  shopify_product_id: "100",
  shopify_variant_id: "200",
  pass_type_id: "ticket-type",
  ticket_type_name: "VIP",
};

describe("Shopify product mappings", () => {
  test("prefers an exact variant mapping over the product mapping", () => {
    const mappings = indexShopifyProductMappings([
      productMapping,
      variantMapping,
    ]);

    assert.equal(
      findShopifyProductMapping(mappings, "100", "200"),
      variantMapping,
    );
  });

  test("falls back to the product mapping for an unmapped variant", () => {
    const mappings = indexShopifyProductMappings([
      productMapping,
      variantMapping,
    ]);

    assert.equal(
      findShopifyProductMapping(mappings, "100", "201"),
      productMapping,
    );
  });

  test("does not match other variants when only a variant is mapped", () => {
    const mappings = indexShopifyProductMappings([variantMapping]);

    assert.equal(findShopifyProductMapping(mappings, "100", "201"), undefined);
  });
});
