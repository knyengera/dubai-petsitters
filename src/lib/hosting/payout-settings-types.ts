export type HostPayoutMethod = "bank_transfer" | "paypal";

export type HostPayoutSettings = {
  host_id: string;
  payout_method: HostPayoutMethod;
  bank_account_holder_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_iban_or_routing: string | null;
  bank_swift_bic: string | null;
  paypal_email: string | null;
  created_at: string;
  updated_at: string;
};

export type HostPayoutSettingsInput = {
  payout_method: HostPayoutMethod;
  bank_account_holder_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_iban_or_routing?: string;
  bank_swift_bic?: string;
  paypal_email?: string;
};

export type PayoutSettingsActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function maskAccountNumber(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  return `****${trimmed.slice(-4)}`;
}

export function formatPayoutDestination(settings: HostPayoutSettings | null | undefined): string {
  if (!settings) return "Not configured";
  if (settings.payout_method === "paypal") {
    return settings.paypal_email ?? "PayPal (no email)";
  }
  const bank = settings.bank_name ?? "Bank";
  const acct = maskAccountNumber(settings.bank_account_number);
  return `${bank} · ${acct}`;
}
