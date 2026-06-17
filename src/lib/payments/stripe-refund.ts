import Stripe from "stripe";
import { getStripeSecretKey, isStripeConfigured } from "@/lib/payments/config";
import { toStripeAmount } from "@/lib/payments/stripe";

function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

export async function createStripeRefund(input: {
  paymentIntentId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
}): Promise<{ refundId: string }> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const stripe = getStripeClient();
  const currency = input.currency.toLowerCase();
  const refund = await stripe.refunds.create(
    {
      payment_intent: input.paymentIntentId,
      amount: toStripeAmount(input.amount, currency),
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
  );

  return { refundId: refund.id };
}
