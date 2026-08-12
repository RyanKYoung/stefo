import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/** Supabase client for client components. */
export function createClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
