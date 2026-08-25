import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  findShopifyProductMapping,
  hasPaidTicketMapping,
  indexShopifyProductMappings,
  type ShopifyProductMapping,
} from "./shopify-product-mappings";

const productMapping: ShopifyProductMapping = {
  event_id: "event-product",
  shopify_product_id: "100",
  shopify_variant_id: null,
  pass_type_id: null,
  ticket_type_name: null,
  ticket_type_category: null,
};

const variantMapping: ShopifyProductMapping = {
  event_id: "event-variant",
  shopify_product_id: "100",
  shopify_variant_id: "200",
  pass_type_id: "ticket-type",
  ticket_type_name: "VIP",
  ticket_type_category: "paid",
};

const freeVariantMapping: ShopifyProductMapping = {
  event_id: "event-free-variant",
  shopify_product_id: "100",
  shopify_variant_id: "300",
  pass_type_id: "free-ticket-type",
  ticket_type_name: "Community",
  ticket_type_category: "free",
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

  test("identifies tickets mapped to a paid pass type", () => {
    assert.equal(
      hasPaidTicketMapping(
        [productMapping, variantMapping, freeVariantMapping],
        [
          { passTypeId: "ticket-type", price: "0.00" },
          { passTypeId: "free-ticket-type", price: "100.00" },
        ],
      ),
      true,
    );
  });

  test("excludes free and unclassified ticket mappings", () => {
    assert.equal(
      hasPaidTicketMapping(
        [productMapping, variantMapping, freeVariantMapping],
        [
          { passTypeId: "free-ticket-type", price: "100.00" },
          { passTypeId: null, price: "0.00" },
        ],
      ),
      false,
    );
  });

  test("uses a positive price for legacy unclassified mappings", () => {
    assert.equal(
      hasPaidTicketMapping(
        [productMapping],
        [{ passTypeId: null, price: "249.00" }],
      ),
      true,
    );
  });
});
