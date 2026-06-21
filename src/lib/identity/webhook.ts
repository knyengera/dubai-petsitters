import "server-only";
import type Stripe from "stripe";
import {
  formatStripeDob,
  mapDocumentTypeToIdType,
  mapStripeSexToGender,
  mapStripeStatus,
} from "@/lib/identity/constants";
import { retrieveVerificationReport } from "@/lib/identity/stripe-identity";
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
  const status = mapStripeStatus(session.status);

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
 * Reads the document data (name, DOB, type, number, sex) extracted by Stripe
 * from the session's verification report. Returns an empty object when no
 * report is available or it can't be retrieved, so verification still succeeds.
 */
async function extractDocumentDetails(
  session: Stripe.Identity.VerificationSession
): Promise<CapturedDocumentDetails> {
  const reportRef = session.last_verification_report;
  if (!reportRef) return {};

  try {
    const report =
      typeof reportRef === "string"
        ? await retrieveVerificationReport(reportRef)
        : reportRef;
    const doc = report.document;
    if (!doc) return {};

    const firstName = doc.first_name?.trim() ?? "";
    const lastName = doc.last_name?.trim() ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
      fullName: fullName || null,
      dateOfBirth: formatStripeDob(doc.dob),
      gender: mapStripeSexToGender(doc.sex),
      idType: mapDocumentTypeToIdType(doc.type),
      idNumber: doc.number?.trim() || null,
    };
  } catch {
    // Verification still counts even if we can't read the extracted details.
    return {};
  }
}
