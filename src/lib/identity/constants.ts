import type Stripe from "stripe";

/** Verification status stored on profiles and identity_verification_sessions. */
export type IdentityVerificationStatus =
  | "pending"
  | "processing"
  | "requires_input"
  | "verified"
  | "canceled";

/** Statuses that won't change without the user starting a new attempt. */
export const TERMINAL_IDENTITY_STATUSES: IdentityVerificationStatus[] = [
  "verified",
  "canceled",
];

export function isTerminalIdentityStatus(
  status: IdentityVerificationStatus | null | undefined
): boolean {
  return !!status && TERMINAL_IDENTITY_STATUSES.includes(status);
}

/** Maps a Stripe VerificationSession status onto our stored status. */
export function mapStripeStatus(
  status: Stripe.Identity.VerificationSession["status"]
): IdentityVerificationStatus {
  switch (status) {
    case "verified":
      return "verified";
    case "processing":
      return "processing";
    case "canceled":
      return "canceled";
    case "requires_input":
    default:
      return "requires_input";
  }
}

/** Profile id_type values supported by the schema. */
export type ProfileIdType = "national_id" | "passport";

/** Profile gender values supported by the schema. */
export type ProfileGender = "male" | "female" | "other" | "prefer_not_to_say";

/** Subset of the Stripe verification report document fields we consume. */
export type StripeDocumentDob = {
  day?: number | null;
  month?: number | null;
  year?: number | null;
};

/**
 * Maps a Stripe document type onto our profile id_type. Returns null for types
 * we don't store (e.g. driving_license), so the user can pick manually.
 */
export function mapDocumentTypeToIdType(
  type: string | null | undefined
): ProfileIdType | null {
  switch (type) {
    case "id_card":
      return "national_id";
    case "passport":
      return "passport";
    default:
      return null;
  }
}

/**
 * Maps Stripe's reported sex onto our gender enum. Only male/female are mapped;
 * unknown/redacted values return null so the user can choose.
 */
export function mapStripeSexToGender(
  sex: string | null | undefined
): ProfileGender | null {
  if (sex === "male" || sex === "female") return sex;
  return null;
}

/** Formats a Stripe DOB object into an ISO date string (YYYY-MM-DD). */
export function formatStripeDob(
  dob: StripeDocumentDob | null | undefined
): string | null {
  if (!dob || dob.year == null || dob.month == null || dob.day == null) {
    return null;
  }
  const month = String(dob.month).padStart(2, "0");
  const day = String(dob.day).padStart(2, "0");
  return `${dob.year}-${month}-${day}`;
}
