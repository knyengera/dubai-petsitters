import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/payments/config";

function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * Client used for reading verification PII. Stripe gates `sex` behind a
 * restricted key, so we prefer STRIPE_IDENTITY_RESTRICTED_KEY when present and
 * fall back to the standard secret key (which still returns DOB / ID number).
 */
function getStripeReadClient(): Stripe {
  const key = process.env.STRIPE_IDENTITY_RESTRICTED_KEY || getStripeSecretKey();
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
        // Our profiles schema only supports national_id + passport, so we
        // disallow driving licenses up-front rather than failing later.
        allowed_types: ["id_card", "passport"],
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

/**
 * Retrieves a verification report, which carries the extracted document data
 * (name, DOB, document type/number, sex) once a session is verified.
 */
export async function retrieveVerificationReport(
  reportId: string
): Promise<Stripe.Identity.VerificationReport> {
  const stripe = getStripeClient();
  return stripe.identity.verificationReports.retrieve(reportId);
}

/**
 * Retrieves a verified session with its PII expanded. Stripe omits sensitive
 * fields (DOB, sex, document number) from responses unless they're explicitly
 * expanded, so we request them here to populate the user's KYC details.
 */
export async function retrieveVerificationSessionWithDetails(
  sessionId: string
): Promise<Stripe.Identity.VerificationSession> {
  const stripe = getStripeReadClient();
  return stripe.identity.verificationSessions.retrieve(sessionId, {
    expand: [
      "verified_outputs.dob",
      "verified_outputs.sex",
      "verified_outputs.id_number",
      "last_verification_report.document.dob",
      "last_verification_report.document.sex",
      "last_verification_report.document.number",
    ],
  });
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
