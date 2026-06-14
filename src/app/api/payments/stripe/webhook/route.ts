import { NextResponse } from "next/server";
import { capturePaymentFromWebhook } from "@/lib/payments/capture";
import { extractStripePaymentId, verifyStripeWebhook } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const event = verifyStripeWebhook(rawBody, signature);

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
