import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until the two Supabase values are set in .env.local */
export const hasSupabase = Boolean(url && key);

let client: SupabaseClient | null = null;

/**
 * Anonymous client, safe on the server and in the browser. It can only read
 * the public menu and call the booking functions; row-level security blocks
 * everything else.
 */
export function publicClient(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase is not configured");
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
