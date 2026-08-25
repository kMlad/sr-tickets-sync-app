export function isPaidTicket(args: {
  passTypeCategory: "free" | "paid" | null;
  price: string | number | null;
}) {
  if (args.passTypeCategory) {
    return args.passTypeCategory === "paid";
  }

  const price = Number(args.price);
  return args.price !== null && Number.isFinite(price) && price > 0;
}
