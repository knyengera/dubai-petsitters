import { NextResponse } from "next/server";
import { capturePaymentFromWebhook } from "@/lib/payments/capture";
import { extractPayPalPaymentId, verifyPayPalWebhook } from "@/lib/payments/paypal";
import { getPayPalWebhookId } from "@/lib/payments/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const webhookId = getPayPalWebhookId();
  if (webhookId) {
    const verification = await verifyPayPalWebhook(request.headers, rawBody);
    if (!verification.verified || !verification.event) {
      return NextResponse.json({ error: "PayPal webhook verification failed" }, { status: 400 });
    }

    const event = verification.event;
    const eventType = String(event.event_type ?? "");

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

  // Dev fallback when webhook ID not configured: parse event without verification
  try {
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const eventType = String(event.event_type ?? "");

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
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PayPal webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
