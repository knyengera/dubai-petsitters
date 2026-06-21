import "server-only";
import type Stripe from "stripe";
import {
  formatStripeDob,
  mapDocumentTypeToIdType,
  mapStripeSexToGender,
  mapStripeStatus,
} from "@/lib/identity/constants";
import { retrieveVerificationSessionWithDetails } from "@/lib/identity/stripe-identity";
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

  await applyVerificationSession(userId, session);
  return true;
}

/**
 * Applies a Stripe Identity verification session to our session + profile
 * records: maps the status, captures the extracted document details on success,
 * and records the failure reason otherwise. Shared by the webhook handler and
 * the polling-based reconcile so both paths behave identically.
 */
export async function applyVerificationSession(
  userId: string,
  session: Stripe.Identity.VerificationSession
): Promise<void> {
  let status = mapStripeStatus(session.status);

  // A freshly created (or abandoned-mid-flow) session sits in `requires_input`
  // with no `last_error` until the user submits documents. Only treat
  // `requires_input` as a failure once Stripe attaches an error — otherwise
  // we'd immediately flag every new session as "verification failed".
  if (status === "requires_input" && !session.last_error) {
    status = "pending";
  }

  await setSessionStatusByStripeId(session.id, status);

  if (status === "verified") {
    const captured = await extractDocumentDetails(session);
    await setProfileVerificationStatus(userId, {
      status,
      stripeSessionId: session.id,
      verifiedAt: new Date().toISOString(),
      error: null,
      ...captured,
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
}

type CapturedDocumentDetails = {
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  idType?: string | null;
  idNumber?: string | null;
};

/**
 * Reads the document data (name, DOB, type, number, sex) extracted by Stripe.
 * These PII fields are omitted from API responses unless explicitly expanded,
 * so we re-fetch the session with the PII expanded and prefer `verified_outputs`
 * (the canonical verified data), falling back to the report's document. Returns
 * an empty object when nothing can be read so verification still succeeds.
 */
async function extractDocumentDetails(
  session: Stripe.Identity.VerificationSession
): Promise<CapturedDocumentDetails> {
  try {
    const detailed = await retrieveVerificationSessionWithDetails(session.id);
    const outputs = detailed.verified_outputs ?? null;

    const report = detailed.last_verification_report;
    const doc =
      report && typeof report === "object" ? report.document ?? null : null;

    const firstName = (outputs?.first_name ?? doc?.first_name)?.trim() ?? "";
    const lastName = (outputs?.last_name ?? doc?.last_name)?.trim() ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
      fullName: fullName || null,
      dateOfBirth: formatStripeDob(outputs?.dob ?? doc?.dob),
      gender: mapStripeSexToGender(outputs?.sex ?? doc?.sex),
      // Document type isn't part of verified_outputs, so read it from the report.
      idType: mapDocumentTypeToIdType(doc?.type),
      idNumber: (outputs?.id_number ?? doc?.number)?.trim() || null,
    };
  } catch {
    // Verification still counts even if we can't read the extracted details.
    return {};
  }
}
