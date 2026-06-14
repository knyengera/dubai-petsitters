/** Supported payment providers (UI + server validation). Live integration for Stripe/PayPal. */
export const SUPPORTED_PAYMENT_PROVIDERS = [
  { id: "paypal", name: "PayPal", currencies: "USD" },
  { id: "payfast", name: "PayFast", currencies: "USD" },
  { id: "salla", name: "Salla", currencies: "USD" },
  { id: "stripe", name: "Stripe", currencies: "USD" },
  { id: "hyperpay", name: "HyperPay", currencies: "USD" },
  { id: "moyasar", name: "Moyasar", currencies: "USD" },
  { id: "tap", name: "Tap", currencies: "USD" },
  { id: "bank_transfer", name: "Bank Transfer", currencies: "USD" },
  { id: "manual", name: "Manual", currencies: "USD" },
] as const;

export type PaymentProviderId = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number]["id"];

export const DEFAULT_CURRENCY = "USD";

export function isSupportedPaymentProvider(value: string): value is PaymentProviderId {
  return SUPPORTED_PAYMENT_PROVIDERS.some((p) => p.id === value);
}

export function formatMoney(amount: number | string | null | undefined, currency = DEFAULT_CURRENCY) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return `${currency} ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}
