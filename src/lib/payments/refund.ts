import { SUPPORTED_PAYMENT_PROVIDERS } from "@/lib/monetisation/constants";
import { createStripeRefund } from "@/lib/payments/stripe-refund";
import { refundPayPalCapture } from "@/lib/payments/paypal";
import { extractStripePaymentMethodLabel } from "@/lib/payments/stripe";
import type { GatewayRefundResult, PaymentMethodInfo, PaymentRecord } from "@/lib/payments/types";

const LIVE_REFUND_PROVIDERS = new Set(["stripe", "paypal"]);
const MANUAL_REFUND_PROVIDERS = new Set(["manual", "bank_transfer"]);

function providerDisplayName(provider: string): string {
  const match = SUPPORTED_PAYMENT_PROVIDERS.find((p) => p.id === provider);
  return match?.name ?? provider.replace(/_/g, " ");
}

export function resolvePaymentProvider(payment: PaymentRecord): string {
  return payment.payment_provider || payment.gateway || "manual";
}

export function getPaymentMethodInfo(payment: PaymentRecord): PaymentMethodInfo {
  const provider = resolvePaymentProvider(payment);
  const stripeLabel = provider === "stripe"
    ? extractStripePaymentMethodLabel(payment.provider_payload ?? undefined)
    : null;

  if (stripeLabel) {
    return { provider, label: stripeLabel };
  }

  if (provider === "paypal") {
    return { provider, label: "PayPal" };
  }

  return { provider, label: providerDisplayName(provider) };
}

export async function createGatewayRefund(
  payment: PaymentRecord,
  amount: number,
  idempotencyKey?: string
): Promise<GatewayRefundResult> {
  const provider = resolvePaymentProvider(payment);
  const currency = payment.currency;

  if (provider === "stripe") {
    if (!payment.provider_payment_id) {
      throw new Error("Stripe payment intent ID is missing");
    }
    const result = await createStripeRefund({
      paymentIntentId: payment.provider_payment_id,
      amount,
      currency,
      idempotencyKey,
    });
    return { providerRefundId: result.refundId, provider };
  }

  if (provider === "paypal") {
    if (!payment.provider_payment_id) {
      throw new Error("PayPal capture ID is missing");
    }
    const result = await refundPayPalCapture(payment.provider_payment_id, amount, currency);
    return { providerRefundId: result.refundId, provider };
  }

  if (MANUAL_REFUND_PROVIDERS.has(provider) || !LIVE_REFUND_PROVIDERS.has(provider)) {
    const syntheticId = `manual_refund_${payment.id}_${Date.now()}`;
    return { providerRefundId: syntheticId, provider };
  }

  throw new Error(`Refunds are not supported for provider: ${provider}`);
}
