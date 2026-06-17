import Stripe from "stripe";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import {
  getPaymentBaseUrl,
  getStripeSecretKey,
  getStripeWebhookSecret,
  isStripeConfigured,
} from "@/lib/payments/config";
import type { PaymentRecord } from "@/lib/payments/types";

function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

function toStripeAmount(amount: number, currency: string): number {
  const zeroDecimal = ["jpy", "krw", "vnd"].includes(currency.toLowerCase());
  return zeroDecimal ? Math.round(amount) : Math.round(amount * 100);
}

function fromStripeAmount(amount: number, currency: string): number {
  const zeroDecimal = ["jpy", "krw", "vnd"].includes(currency.toLowerCase());
  return zeroDecimal ? amount : amount / 100;
}

export { toStripeAmount, fromStripeAmount };

function successPath(payment: PaymentRecord): string {
  if (payment.payment_type === "booking_escrow") {
    return `/payments/booking/success?paymentId=${payment.id}`;
  }
  if (payment.payment_type === "vet_subscription") {
    return `/payments/vet/success?paymentId=${payment.id}`;
  }
  return `/payments/partner/success?paymentId=${payment.id}`;
}

function cancelPath(payment: PaymentRecord): string {
  if (payment.payment_type === "booking_escrow") {
    return `/payments/booking/cancel?paymentId=${payment.id}`;
  }
  if (payment.payment_type === "vet_subscription") {
    return `/payments/vet/cancel?paymentId=${payment.id}`;
  }
  return `/payments/partner/cancel?paymentId=${payment.id}`;
}

export async function createStripeCheckoutSession(
  payment: PaymentRecord,
  provider: string
): Promise<{ url: string; sessionId: string }> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const stripe = getStripeClient();
  const baseUrl = getPaymentBaseUrl();
  const currency = (payment.currency || DEFAULT_CURRENCY).toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}${successPath(payment)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}${cancelPath(payment)}`,
    customer_email: payment.payer_email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeAmount(Number(payment.amount), currency),
          product_data: {
            name: payment.payment_type.replace(/_/g, " "),
          },
        },
      },
    ],
    metadata: {
      payment_id: payment.id,
      payment_type: payment.payment_type,
      reference_id: payment.reference_id || "",
      booking_id: payment.booking_id || "",
      provider,
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { url: session.url, sessionId: session.id };
}

export function verifyStripeWebhook(
  rawBody: string,
  signature: string
): Stripe.Event {
  const secret = getStripeWebhookSecret();
  if (!secret) throw new Error("Stripe webhook secret is not configured");
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export function extractStripePaymentId(event: Stripe.Event): {
  paymentId: string | null;
  providerPaymentId: string | null;
} {
  const obj = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
  const metadata = "metadata" in obj ? obj.metadata : undefined;
  const paymentId = metadata?.payment_id ?? null;

  if (event.type === "checkout.session.completed") {
    const session = obj as Stripe.Checkout.Session;
    return {
      paymentId,
      providerPaymentId:
        (typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id) || session.id,
    };
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = obj as Stripe.PaymentIntent;
    return { paymentId: intent.metadata?.payment_id ?? null, providerPaymentId: intent.id };
  }

  return { paymentId, providerPaymentId: null };
}

export function extractStripePaymentMethodLabel(
  providerPayload: Record<string, unknown> | null | undefined
): string | null {
  if (!providerPayload) return null;

  const data = providerPayload.data as { object?: Record<string, unknown> } | undefined;
  const obj = data?.object ?? providerPayload;

  const paymentMethodTypes = obj.payment_method_types as string[] | undefined;
  if (paymentMethodTypes?.includes("card")) {
    const charges = obj.charges as { data?: Array<{ payment_method_details?: { card?: { brand?: string; last4?: string } } }> } | undefined;
    const card = charges?.data?.[0]?.payment_method_details?.card;
    if (card?.brand) {
      const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
      return card.last4 ? `${brand} •••• ${card.last4}` : brand;
    }
    return "Card";
  }

  if (paymentMethodTypes?.length) {
    return paymentMethodTypes[0].replace(/_/g, " ");
  }

  const session = obj as Stripe.Checkout.Session;
  if (session.payment_method_types?.length) {
    return session.payment_method_types[0].replace(/_/g, " ");
  }

  return null;
}

export function extractStripeRefundDetails(event: Stripe.Event): {
  providerRefundId: string | null;
  providerPaymentId: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
} {
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const refund = charge.refunds?.data?.[0];
    return {
      providerRefundId: refund?.id ?? null,
      providerPaymentId:
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null,
      amount: refund?.amount != null ? fromStripeAmount(refund.amount, charge.currency) : null,
      currency: charge.currency?.toUpperCase() ?? null,
      status: "succeeded",
    };
  }

  if (event.type === "refund.updated" || event.type === "refund.created") {
    const refund = event.data.object as Stripe.Refund;
    return {
      providerRefundId: refund.id,
      providerPaymentId:
        typeof refund.payment_intent === "string"
          ? refund.payment_intent
          : refund.payment_intent?.id ?? null,
      amount: refund.amount != null ? fromStripeAmount(refund.amount, refund.currency) : null,
      currency: refund.currency?.toUpperCase() ?? null,
      status: refund.status ?? null,
    };
  }

  return { providerRefundId: null, providerPaymentId: null, amount: null, currency: null, status: null };
}
