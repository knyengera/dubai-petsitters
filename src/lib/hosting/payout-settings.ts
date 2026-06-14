"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  HostPayoutSettings,
  HostPayoutSettingsInput,
  PayoutSettingsActionResult,
} from "@/lib/hosting/payout-settings-types";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function parseRow(row: Record<string, unknown>): HostPayoutSettings {
  return {
    host_id: String(row.host_id),
    payout_method: row.payout_method as HostPayoutSettings["payout_method"],
    bank_account_holder_name: row.bank_account_holder_name
      ? String(row.bank_account_holder_name)
      : null,
    bank_name: row.bank_name ? String(row.bank_name) : null,
    bank_account_number: row.bank_account_number
      ? String(row.bank_account_number)
      : null,
    bank_iban_or_routing: row.bank_iban_or_routing
      ? String(row.bank_iban_or_routing)
      : null,
    bank_swift_bic: row.bank_swift_bic ? String(row.bank_swift_bic) : null,
    paypal_email: row.paypal_email ? String(row.paypal_email) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function validateInput(input: HostPayoutSettingsInput): string | null {
  if (input.payout_method === "bank_transfer") {
    if (!input.bank_account_holder_name?.trim()) {
      return "Account holder name is required";
    }
    if (!input.bank_name?.trim()) return "Bank name is required";
    if (!input.bank_account_number?.trim()) return "Account number is required";
    if (!input.bank_iban_or_routing?.trim()) {
      return "IBAN or routing number is required";
    }
    return null;
  }

  if (input.payout_method === "paypal") {
    const email = input.paypal_email?.trim();
    if (!email) return "PayPal email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid PayPal email";
    }
    return null;
  }

  return "Unsupported payout method";
}

export async function getHostPayoutSettings(
  hostId: string
): Promise<PayoutSettingsActionResult<HostPayoutSettings | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("host_payout_settings")
      .select("*")
      .eq("host_id", hostId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };
    return { ok: true, data: parseRow(data as Record<string, unknown>) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function saveHostPayoutSettings(
  hostId: string,
  input: HostPayoutSettingsInput
): Promise<PayoutSettingsActionResult<HostPayoutSettings>> {
  try {
    const validationError = validateInput(input);
    if (validationError) return { ok: false, error: validationError };

    const now = new Date().toISOString();
    const row =
      input.payout_method === "bank_transfer"
        ? {
            host_id: hostId,
            payout_method: input.payout_method,
            bank_account_holder_name: input.bank_account_holder_name!.trim(),
            bank_name: input.bank_name!.trim(),
            bank_account_number: input.bank_account_number!.trim(),
            bank_iban_or_routing: input.bank_iban_or_routing!.trim(),
            bank_swift_bic: input.bank_swift_bic?.trim() || null,
            paypal_email: null,
            updated_at: now,
          }
        : {
            host_id: hostId,
            payout_method: input.payout_method,
            bank_account_holder_name: null,
            bank_name: null,
            bank_account_number: null,
            bank_iban_or_routing: null,
            bank_swift_bic: null,
            paypal_email: input.paypal_email!.trim(),
            updated_at: now,
          };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("host_payout_settings")
      .upsert(row as never, { onConflict: "host_id" })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };

    revalidatePath("/host-earnings");
    revalidatePath("/admin/payouts");
    return { ok: true, data: parseRow(data as Record<string, unknown>) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
