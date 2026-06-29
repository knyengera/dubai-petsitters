import { createClient } from "@/lib/supabase/server";

/**
 * Public read of the global partner advertising billing toggle.
 * Reads via the SECURITY DEFINER RPC, falling back to a direct table select,
 * and defaults to `true` (paid flow) on any error so existing behavior is safe.
 */
export async function getPartnerBillingEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_partner_advertising_settings");

  if (error) {
    const { data: fallback } = await supabase
      .from("partner_advertising_settings")
      .select("billing_enabled")
      .limit(1)
      .maybeSingle();

    const row = fallback as { billing_enabled?: boolean } | null;
    return row?.billing_enabled !== false;
  }

  const row = data as { billing_enabled?: boolean } | null;
  return row?.billing_enabled !== false;
}
