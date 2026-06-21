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
