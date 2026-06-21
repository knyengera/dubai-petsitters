import { NextResponse } from "next/server";
import { verifyIdentityWebhook } from "@/lib/identity/stripe-identity";
import {
  handleIdentityWebhookEvent,
  isIdentityEvent,
} from "@/lib/identity/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event;
  try {
    event = verifyIdentityWebhook(rawBody, signature);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!isIdentityEvent(event)) {
    return NextResponse.json({ received: true });
  }

  try {
    const handled = await handleIdentityWebhookEvent(event);
    if (!handled) {
      return NextResponse.json({ error: "Could not correlate event" }, { status: 400 });
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Stripe identity webhook failed:", e);
    const message = e instanceof Error ? e.message : "Webhook handling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
