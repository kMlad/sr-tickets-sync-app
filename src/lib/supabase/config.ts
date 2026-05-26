import { env } from "@/env";

export function getSupabaseConfig() {
  return {
    supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  };
}
