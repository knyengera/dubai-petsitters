export type BookingQuote = {
  currency: string;
  unit_price: number;
  units: number;
  base_amount: number;
  guest_fee_amount: number;
  total_amount: number;
  host_payout_fee_pct: number;
  guest_service_fee_pct: number;
  fee_settings_id: string;
};

export type EscrowStatus =
  | "none"
  | "pending_payment"
  | "held"
  | "release_pending"
  | "released"
  | "refunded"
  | "disputed"
  | "cancelled";

export type HostBalance = {
  host_id: string;
  currency: string;
  available_balance: number;
  pending_balance: number;
  lifetime_earned: number;
  lifetime_paid_out: number;
  updated_at: string;
};

export type HostPayoutRequest = {
  id: string;
  host_id: string;
  currency: string;
  gross_amount: number;
  payout_fee_pct: number;
  payout_fee_amount: number;
  net_amount: number;
  status: "pending" | "approved" | "processing" | "paid" | "rejected" | "cancelled";
  payment_provider: string | null;
  provider_payout_id: string | null;
  notes: string | null;
  admin_notes: string | null;
  requested_by_email: string;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformFeeSettings = {
  id: string;
  name: string;
  guest_service_fee_pct: number;
  host_payout_fee_pct: number;
  guest_fee_min: number;
  guest_fee_max: number | null;
  host_payout_fee_min: number;
  host_payout_fee_max: number | null;
  currency: string;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
};

export type PaymentProviderSettings = {
  provider_id: string;
  display_name: string;
  currencies: string;
  is_enabled: boolean;
  sort_order: number;
  integration_mode: "live" | "manual";
  updated_at?: string;
  updated_by?: string | null;
};

export type CreateBookingInput = {
  hostId: string;
  serviceType: string;
  startDate: string;
  endDate?: string | null;
  petName: string;
  petType: string;
  city?: string | null;
  paymentProvider: string;
  idempotencyKey?: string;
};

export type HostBookingCalendar = {
  host_available: boolean;
  blocked_dates: string[];
  booked_dates: string[];
  custom_prices: { date: string; price: number }[];
};

export type MonetisationActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function monetisationError(result: MonetisationActionResult<unknown>): string {
  if (result.ok === false) return result.error;
  return "Unknown error";
}
