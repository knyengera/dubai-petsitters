export type SignupAccountType = "client" | "host";

export const PENDING_SIGNUP_ACCOUNT_TYPE_KEY = "pending_signup_account_type";

export function isSignupAccountType(value: unknown): value is SignupAccountType {
  return value === "client" || value === "host";
}

export function normalizeSignupAccountType(
  value: unknown
): SignupAccountType | null {
  return isSignupAccountType(value) ? value : null;
}
