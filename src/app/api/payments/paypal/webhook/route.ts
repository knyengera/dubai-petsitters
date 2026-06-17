import { NextResponse } from "next/server";
import { capturePaymentFromWebhook } from "@/lib/payments/capture";
import { recordRefundFromWebhook } from "@/lib/payments/refund-reconcile";
import {
  extractPayPalPaymentId,
  extractPayPalRefundDetails,
  verifyPayPalWebhook,
} from "@/lib/payments/paypal";
import { getPayPalWebhookId } from "@/lib/payments/config";

export const runtime = "nodejs";

async function handlePayPalEvent(event: Record<string, unknown>) {
  const eventType = String(event.event_type ?? "");

  if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
    const refundDetails = extractPayPalRefundDetails(event);
    if (
      !refundDetails.providerRefundId ||
      !refundDetails.providerPaymentId ||
      refundDetails.amount == null
    ) {
      return NextResponse.json({ received: true });
    }

    const result = await recordRefundFromWebhook({
      providerPaymentId: refundDetails.providerPaymentId,
      providerRefundId: refundDetails.providerRefundId,
      amount: refundDetails.amount,
      metadata: { event_type: eventType, currency: refundDetails.currency },
    });

    if (result.ok === false) {
      console.error("PayPal refund reconciliation failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  if (
    eventType !== "CHECKOUT.ORDER.APPROVED" &&
    eventType !== "PAYMENT.CAPTURE.COMPLETED"
  ) {
    return NextResponse.json({ received: true });
  }

  const { paymentId, providerPaymentId, orderId } = extractPayPalPaymentId(event);
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment metadata" }, { status: 400 });
  }

  const result = await capturePaymentFromWebhook({
    paymentId,
    providerPaymentId: providerPaymentId || orderId || paymentId,
    providerPayload: event,
    paypalOrderId: eventType === "CHECKOUT.ORDER.APPROVED" ? orderId : null,
  });

  if (result.ok === false) {
    console.error("PayPal webhook capture failed:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const webhookId = getPayPalWebhookId();
  if (webhookId) {
    const verification = await verifyPayPalWebhook(request.headers, rawBody);
    if (!verification.verified || !verification.event) {
      return NextResponse.json({ error: "PayPal webhook verification failed" }, { status: 400 });
    }

    return handlePayPalEvent(verification.event);
  }

  // Dev fallback when webhook ID not configured: parse event without verification
  try {
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    return handlePayPalEvent(event);
  } catch (e) {
    const message = e instanceof Error ? e.message : "PayPal webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
