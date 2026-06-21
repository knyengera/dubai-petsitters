import "server-only";
import type Stripe from "stripe";
import { mapStripeStatus } from "@/lib/identity/constants";
import {
  setProfileVerificationStatus,
  setSessionStatusByStripeId,
} from "@/lib/identity/session-store";

const HANDLED_EVENT_PREFIX = "identity.verification_session.";

export function isIdentityEvent(event: Stripe.Event): boolean {
  return event.type.startsWith(HANDLED_EVENT_PREFIX);
}

/**
 * Applies a Stripe Identity webhook event to our profile + session records.
 * Returns false when the event can't be correlated to a user.
 */
export async function handleIdentityWebhookEvent(
  event: Stripe.Event
): Promise<boolean> {
  if (!isIdentityEvent(event)) return false;

  const session = event.data.object as Stripe.Identity.VerificationSession;
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  if (!userId) return false;

  const status = mapStripeStatus(session.status);

  await setSessionStatusByStripeId(session.id, status);

  if (status === "verified") {
    await setProfileVerificationStatus(userId, {
      status,
      stripeSessionId: session.id,
      verifiedAt: new Date().toISOString(),
      error: null,
    });
  } else {
    await setProfileVerificationStatus(userId, {
      status,
      stripeSessionId: session.id,
      error:
        status === "requires_input"
          ? session.last_error?.reason ?? "Verification could not be completed."
          : null,
    });
  }

  return true;
}
