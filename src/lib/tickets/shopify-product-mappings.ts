import { isPaidTicket } from "@/lib/tickets/ticket-payment";

export type ShopifyProductMapping = {
  event_id: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  pass_type_id: string | null;
  ticket_type_name: string | null;
  ticket_type_category: "free" | "paid" | null;
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

export function hasPaidTicketMapping(
  mappings: Iterable<ShopifyProductMapping>,
  tickets: Iterable<{
    passTypeId: string | null;
    price: string | number | null;
  }>,
) {
  const categoriesByPassTypeId = new Map(
    [...mappings]
      .filter(
        (
          mapping,
        ): mapping is ShopifyProductMapping & {
          pass_type_id: string;
          ticket_type_category: "free" | "paid";
        } =>
          mapping.pass_type_id !== null &&
          mapping.ticket_type_category !== null,
      )
      .map((mapping) => [mapping.pass_type_id, mapping.ticket_type_category]),
  );

  return [...tickets].some((ticket) => {
    const category = ticket.passTypeId
      ? categoriesByPassTypeId.get(ticket.passTypeId)
      : undefined;

    return isPaidTicket({
      passTypeCategory: category ?? null,
      price: ticket.price,
    });
  });
}
