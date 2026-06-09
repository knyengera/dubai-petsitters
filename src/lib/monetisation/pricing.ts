import type { BookingQuote } from "@/lib/monetisation/types";

/** Parse server-authoritative quote JSON from RPC. */
export function parseBookingQuote(raw: unknown): BookingQuote | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const num = (k: string) => {
    const v = q[k];
    return typeof v === "number" ? v : parseFloat(String(v ?? 0));
  };
  const str = (k: string) => String(q[k] ?? "");
  if (!str("fee_settings_id")) return null;
  return {
    currency: str("currency") || "SAR",
    unit_price: num("unit_price"),
    units: num("units") || 1,
    base_amount: num("base_amount"),
    guest_fee_amount: num("guest_fee_amount"),
    total_amount: num("total_amount"),
    host_payout_fee_pct: num("host_payout_fee_pct"),
    guest_service_fee_pct: num("guest_service_fee_pct"),
    fee_settings_id: str("fee_settings_id"),
  };
}

/** Display-only breakdown labels for UI. Amounts must come from server quote. */
export function quoteToSummary(quote: BookingQuote, title: string) {
  return {
    title,
    lines: [
      {
        label: `Host price (${quote.units} unit${quote.units !== 1 ? "s" : ""})`,
        value: `${quote.currency} ${quote.base_amount.toFixed(2)}`,
      },
      {
        label: `Platform fee (${quote.guest_service_fee_pct}%)`,
        value: `${quote.currency} ${quote.guest_fee_amount.toFixed(2)}`,
      },
    ],
    total: `${quote.currency} ${quote.total_amount.toFixed(2)}`,
    quote,
  };
}

/** Estimate payout net from gross using server pct (display only). */
export function estimatePayoutNet(gross: number, feePct: number) {
  const fee = Math.round(gross * (feePct / 100) * 100) / 100;
  return {
    gross,
    fee,
    net: Math.round((gross - fee) * 100) / 100,
  };
}
