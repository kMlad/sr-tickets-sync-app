export function hasSuccessfulShopifyPayment(
  financialStatus: string | null | undefined,
) {
  return financialStatus?.trim().toLowerCase() === "paid";
}
