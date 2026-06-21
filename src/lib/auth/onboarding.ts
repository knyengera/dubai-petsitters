import type { User } from "@supabase/supabase-js";
import {
  getDefaultHomePath,
  getSafeNextPath,
  isAdminRole,
} from "@/lib/auth/routes";
import type { SignupAccountType } from "@/lib/auth/constants";
import { LEGAL_DOCUMENTS_VERSION } from "@/lib/legal/constants";

export type ProfileRow = {
  full_name: string | null;
  city: string | null;
  date_of_birth: string | null;
  gender: string | null;
  id_type: string | null;
  id_number: string | null;
  avatar_url: string | null;
  id_document_path: string | null;
  id_verification_status: string | null;
  id_verified_at: string | null;
  profile_completed_at: string | null;
  phone_verified_at: string | null;
  phone: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  liability_waiver_accepted_at: string | null;
  legal_documents_version: string | null;
  signup_account_type: SignupAccountType | null;
};

export function getSignupAccountType(
  profile: ProfileRow | null
): SignupAccountType {
  return profile?.signup_account_type ?? "client";
}

export function isHostSignup(profile: ProfileRow | null): boolean {
  return getSignupAccountType(profile) === "host";
}

export function isEmailVerified(user: User | null): boolean {
  return !!user?.email_confirmed_at;
}

export function isPhoneVerified(user: User | null): boolean {
  return !!user?.phone_confirmed_at;
}

export function hasProfileDetails(profile: ProfileRow | null): boolean {
  if (!profile) return false;
  // Every account type now verifies their ID via Stripe Identity (separate
  // step), so no manual ID document upload is required here.
  return !!(
    profile.full_name?.trim() &&
    profile.city?.trim() &&
    profile.date_of_birth &&
    profile.gender &&
    profile.id_type &&
    profile.id_number?.trim() &&
    profile.avatar_url?.trim()
  );
}

/** All users must pass Stripe Identity before onboarding is considered done. */
export function isIdentityVerified(profile: ProfileRow | null): boolean {
  return profile?.id_verification_status === "verified";
}

/**
 * Whether the user still needs to complete the identity verification step.
 * New users must verify via Stripe Identity. Users who already finished
 * onboarding before identity verification was introduced are grandfathered in
 * (their `profile_completed_at` is set), so they're never forced to re-verify.
 */
export function needsIdentityVerification(profile: ProfileRow | null): boolean {
  if (isIdentityVerified(profile)) return false;
  if (profile?.profile_completed_at) return false;
  return true;
}

export function isProfileComplete(profile: ProfileRow | null): boolean {
  if (!hasProfileDetails(profile)) return false;
  return !!profile?.profile_completed_at;
}

export function hasLegalAcceptance(profile: ProfileRow | null): boolean {
  return !!(
    profile?.terms_accepted_at &&
    profile?.privacy_accepted_at &&
    profile?.liability_waiver_accepted_at &&
    profile?.legal_documents_version === LEGAL_DOCUMENTS_VERSION
  );
}

export function isBaseOnboardingComplete(
  user: User | null,
  profile: ProfileRow | null
): boolean {
  if (!user) return false;
  return (
    hasLegalAcceptance(profile) &&
    isEmailVerified(user) &&
    isPhoneVerified(user) &&
    isProfileComplete(profile)
  );
}

export function isOnboardingComplete(
  user: User | null,
  profile: ProfileRow | null,
  options?: { hasHostProfile?: boolean }
): boolean {
  // Admins don't go through the user onboarding/KYC flow.
  if (isAdminRole(user?.app_metadata)) return true;
  if (!isBaseOnboardingComplete(user, profile)) return false;
  if (needsIdentityVerification(profile)) return false;
  if (isHostSignup(profile)) {
    return options?.hasHostProfile === true;
  }
  return true;
}

export function getOnboardingRedirect(
  user: User | null,
  profile: ProfileRow | null,
  options?: { hasHostProfile?: boolean }
): "/profile/complete" | null {
  if (!user) return null;
  if (isOnboardingComplete(user, profile, options)) return null;
  return "/profile/complete";
}

export function resolvePostAuthRedirect(
  user: User | null,
  profile: ProfileRow | null,
  next: string | null | undefined,
  options?: { hasHostProfile?: boolean }
): string {
  const isAdmin = isAdminRole(user?.app_metadata);
  const defaultHome = getDefaultHomePath(isAdmin);
  const onboardingRedirect = getOnboardingRedirect(user, profile, options);
  if (onboardingRedirect) {
    const safeNext = getSafeNextPath(next, { isAdmin });
    if (safeNext !== defaultHome) {
      return `${onboardingRedirect}?next=${encodeURIComponent(safeNext)}`;
    }
    return onboardingRedirect;
  }
  return getSafeNextPath(next, { isAdmin });
}

export function maskIdNumber(idNumber: string | null | undefined): string {
  if (!idNumber) return "";
  if (idNumber.length <= 4) return "****";
  return `****${idNumber.slice(-4)}`;
}

export function validateNationalId(idNumber: string): boolean {
  return /^\d{10}$/.test(idNumber);
}

export function validatePassport(idNumber: string): boolean {
  return /^[A-Za-z0-9]{6,12}$/.test(idNumber);
}

export function toE164Phone(phone: string, defaultCountryCode = "+966"): string {
  const trimmed = phone.trim();
  if (!trimmed) return defaultCountryCode;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : defaultCountryCode;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return defaultCountryCode;

  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `${defaultCountryCode}${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `${defaultCountryCode}${digits}`;
  if (digits.length >= 10) return `+${digits}`;

  return `${defaultCountryCode}${digits}`;
}

export function sanitizePhoneInput(value: string): string {
  const trimmed = value.trimStart();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }
  return trimmed.replace(/\D/g, "");
}

export function isValidE164Phone(phone: string): boolean {
  const e164 = toE164Phone(phone);
  return /^\+\d{8,15}$/.test(e164);
}
