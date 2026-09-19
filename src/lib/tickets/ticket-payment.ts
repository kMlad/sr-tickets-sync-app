import type { PassTypeCategory } from "@/lib/tickets/pass-types";

export function isPaidTicket(args: {
  passTypeCategory: PassTypeCategory | null;
  price: string | number | null;
}) {
  if (args.passTypeCategory) {
    return args.passTypeCategory === "paid";
  }

  const price = Number(args.price);
  return args.price !== null && Number.isFinite(price) && price > 0;
}
