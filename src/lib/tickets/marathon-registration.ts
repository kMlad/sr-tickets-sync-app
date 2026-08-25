import { hasSuccessfulShopifyPayment } from "@/lib/tickets/shopify-order-payment";
import { isPaidTicket } from "@/lib/tickets/ticket-payment";

export function includesMarathonRegistration(args: {
  financialStatus: string | null | undefined;
  passTypeCategory: "free" | "paid" | null;
  price: string | number | null;
}) {
  return (
    hasSuccessfulShopifyPayment(args.financialStatus) && isPaidTicket(args)
  );
}
