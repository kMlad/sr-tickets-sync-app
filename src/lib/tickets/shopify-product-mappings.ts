export type ShopifyProductMapping = {
  event_id: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  pass_type_id: string | null;
  ticket_type_name: string | null;
};

function mappingKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? "*"}`;
}

export function indexShopifyProductMappings(mappings: ShopifyProductMapping[]) {
  return new Map(
    mappings.map((mapping) => [
      mappingKey(mapping.shopify_product_id, mapping.shopify_variant_id),
      mapping,
    ]),
  );
}

export function findShopifyProductMapping(
  mappings: Map<string, ShopifyProductMapping>,
  productId: string,
  variantId: string | null,
) {
  if (variantId) {
    const variantMapping = mappings.get(mappingKey(productId, variantId));

    if (variantMapping) {
      return variantMapping;
    }
  }

  return mappings.get(mappingKey(productId, null));
}
