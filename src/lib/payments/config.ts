import { getAppBaseUrl } from "@/lib/notifications/config";

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY;
}

export function getStripePublishableKey(): string | undefined {
  return (
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

export function getPayPalClientId(): string | undefined {
  return process.env.PAYPAL_CLIENT_ID;
}

export function getPayPalClientSecret(): string | undefined {
  return process.env.PAYPAL_CLIENT_SECRET;
}

export function getPayPalWebhookId(): string | undefined {
  return process.env.PAYPAL_WEBHOOK_ID;
}

export function getPayPalApiBase(): string {
  return (
    process.env.PAYPAL_API_BASE ||
    (process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com")
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(getStripeWebhookSecret());
}

export function isPayPalConfigured(): boolean {
  return Boolean(getPayPalClientId() && getPayPalClientSecret());
}

export function isPayPalWebhookConfigured(): boolean {
  return Boolean(getPayPalWebhookId());
}

export function getPaymentBaseUrl(): string {
  return getAppBaseUrl();
}

export const LIVE_PAYMENT_PROVIDERS = ["stripe", "paypal"] as const;

export function isLivePaymentProvider(provider: string): boolean {
  return (LIVE_PAYMENT_PROVIDERS as readonly string[]).includes(provider);
}

export const BANK_TRANSFER_INSTRUCTIONS =
  "Please transfer the exact amount to our bank account. Reference your booking or subscription ID in the transfer notes. An admin will confirm your payment within 1–2 business days.";
