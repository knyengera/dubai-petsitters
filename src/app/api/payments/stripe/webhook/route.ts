import { NextResponse } from "next/server";
import { capturePaymentFromWebhook } from "@/lib/payments/capture";
import { recordRefundFromWebhook } from "@/lib/payments/refund-reconcile";
import {
  extractStripePaymentId,
  extractStripeRefundDetails,
  verifyStripeWebhook,
} from "@/lib/payments/stripe";
import {
  handlePartnerSubscriptionEvent,
  isPartnerSubscriptionEvent,
} from "@/lib/partners/subscription-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const event = verifyStripeWebhook(rawBody, signature);

    // Recurring partner-advertising subscriptions (Stripe Billing) are handled
    // separately from one-time payment captures.
    if (isPartnerSubscriptionEvent(event)) {
      await handlePartnerSubscriptionEvent(event);
      return NextResponse.json({ received: true });
    }

    if (event.type === "charge.refunded" || event.type === "refund.updated" || event.type === "refund.created") {
      const refundDetails = extractStripeRefundDetails(event);
      if (
        !refundDetails.providerRefundId ||
        !refundDetails.providerPaymentId ||
        refundDetails.amount == null
      ) {
        return NextResponse.json({ received: true });
      }

      if (event.type !== "charge.refunded" && refundDetails.status && refundDetails.status !== "succeeded") {
        return NextResponse.json({ received: true });
      }

      const result = await recordRefundFromWebhook({
        providerPaymentId: refundDetails.providerPaymentId,
        providerRefundId: refundDetails.providerRefundId,
        amount: refundDetails.amount,
        metadata: { event_type: event.type, currency: refundDetails.currency },
      });

      if (result.ok === false) {
        console.error("Stripe refund reconciliation failed:", result.error);
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ received: true });
    }

    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "payment_intent.succeeded"
    ) {
      return NextResponse.json({ received: true });
    }

    const { paymentId, providerPaymentId } = extractStripePaymentId(event);
    if (!paymentId || !providerPaymentId) {
      return NextResponse.json({ error: "Missing payment metadata" }, { status: 400 });
    }

    const result = await capturePaymentFromWebhook({
      paymentId,
      providerPaymentId,
      providerPayload: event as unknown as Record<string, unknown>,
    });

    if (result.ok === false) {
      console.error("Stripe webhook capture failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
