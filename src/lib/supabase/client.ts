import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { supabasePublishableKey, supabaseUrl } = getSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
