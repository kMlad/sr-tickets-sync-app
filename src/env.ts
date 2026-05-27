import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}, z.string().min(1).optional());

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  server: {
    SUPABASE_ADMIN_EMAILS: z
      .string()
      .default("")
      .transform((v) =>
        v
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SHOPIFY_API_KEY: z.string().min(1),
    SHOPIFY_API_SECRET: z.string().min(1),
    SHOPIFY_APP_URL: z.url(),
    SHOPIFY_ALLOWED_SHOP_DOMAIN: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)
      .transform((value) => value.toLowerCase()),
    SHOPIFY_SCOPES: z
      .string()
      .min(1)
      .transform((value) =>
        value
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean),
      ),
    SHOPIFY_TOKEN_ENCRYPTION_KEY: z
      .string()
      .min(1)
      .describe(
        "Base64-encoded 32-byte key used to encrypt Shopify tokens at rest.",
      ),
    RESEND_API_KEY: optionalNonEmptyString,
    RESEND_FROM_EMAIL: optionalNonEmptyString,
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
});
