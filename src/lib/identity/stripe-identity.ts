import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/payments/config";

function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * Dedicated signing secret for the Identity webhook endpoint. Falls back to the
 * shared payments secret so a single endpoint can serve both if desired.
 */
function getIdentityWebhookSecret(): string | undefined {
  return (
    process.env.STRIPE_IDENTITY_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

export function isStripeIdentityConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

/**
 * Creates a document + selfie verification session. Camera capture is forced so
 * the phone-based flow can't fall back to uploading an existing photo.
 */
export async function createVerificationSession(params: {
  userId: string;
  returnUrl: string;
  email?: string | null;
}): Promise<Stripe.Identity.VerificationSession> {
  const stripe = getStripeClient();
  return stripe.identity.verificationSessions.create({
    type: "document",
    client_reference_id: params.userId,
    metadata: { user_id: params.userId },
    return_url: params.returnUrl,
    options: {
      document: {
        require_matching_selfie: true,
        require_live_capture: true,
      },
    },
  });
}

export async function retrieveVerificationSession(
  sessionId: string
): Promise<Stripe.Identity.VerificationSession> {
  const stripe = getStripeClient();
  return stripe.identity.verificationSessions.retrieve(sessionId);
}

export function verifyIdentityWebhook(
  rawBody: string,
  signature: string
): Stripe.Event {
  const secret = getIdentityWebhookSecret();
  if (!secret) throw new Error("Stripe identity webhook secret is not configured");
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
