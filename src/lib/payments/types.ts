export type PaymentFlowType =
  | "booking_escrow"
  | "vet_subscription"
  | "partner_advertising";

export type PaymentProviderSetting = {
  provider_id: string;
  display_name: string;
  currencies: string;
  is_enabled: boolean;
  sort_order: number;
  integration_mode: "live" | "manual";
  updated_at?: string;
  updated_by?: string | null;
};

export type EnabledPaymentProvider = PaymentProviderSetting & {
  integrationStatus: "live" | "manual" | "not_configured";
};

export type PaymentRecord = {
  id: string;
  payment_type: string;
  gateway: string;
  payment_provider?: string | null;
  amount: number;
  currency: string;
  status: string;
  reference_id?: string | null;
  booking_id?: string | null;
  payer_name?: string | null;
  payer_email: string;
  provider_checkout_id?: string | null;
};

export type CheckoutRequest = {
  paymentId: string;
  provider: string;
};

export type CheckoutResult = {
  url: string;
  checkoutId: string;
  mode: "redirect" | "manual";
};

export type PaymentSummary = {
  title: string;
  lines: { label: string; value: string }[];
  total: string;
};

export type PaymentConfirmResult = {
  mode: "redirect" | "manual" | "awaiting";
  paymentId: string;
  checkoutUrl?: string;
  message?: string;
};
