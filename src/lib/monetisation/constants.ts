/** Supported payment providers (UI + server validation). Live integration for Stripe/PayPal. */
export const SUPPORTED_PAYMENT_PROVIDERS = [
  { id: "paypal", name: "PayPal", currencies: "USD / SAR" },
  { id: "payfast", name: "PayFast", currencies: "ZAR / SAR" },
  { id: "salla", name: "Salla", currencies: "SAR" },
  { id: "stripe", name: "Stripe", currencies: "Multi" },
  { id: "hyperpay", name: "HyperPay", currencies: "SAR" },
  { id: "moyasar", name: "Moyasar", currencies: "SAR" },
  { id: "tap", name: "Tap", currencies: "SAR" },
  { id: "bank_transfer", name: "Bank Transfer", currencies: "SAR" },
  { id: "manual", name: "Manual", currencies: "SAR" },
] as const;

export type PaymentProviderId = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number]["id"];

export const DEFAULT_CURRENCY = "SAR";

export function isSupportedPaymentProvider(value: string): value is PaymentProviderId {
  return SUPPORTED_PAYMENT_PROVIDERS.some((p) => p.id === value);
}

export function formatMoney(amount: number | string | null | undefined, currency = DEFAULT_CURRENCY) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return `${currency} ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}
