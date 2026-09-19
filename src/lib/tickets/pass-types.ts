export const PASS_TYPE_CATEGORIES = ["free", "paid", "media"] as const;

export type PassTypeCategory = (typeof PASS_TYPE_CATEGORIES)[number];
