import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let cachedClientSignature: string | null = null;

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  const signature = `${url}:${key}`;

  if (cachedClient && cachedClientSignature === signature) {
    return cachedClient;
  }

  cachedClient = createBrowserClient<Database>(url, key, { isSingleton: false });
  cachedClientSignature = signature;
  return cachedClient;
}
