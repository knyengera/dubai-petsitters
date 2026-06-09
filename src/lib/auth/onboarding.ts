import type { User } from "@supabase/supabase-js";
import { getSafeNextPath } from "@/lib/auth/routes";
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
  profile_completed_at: string | null;
  phone_verified_at: string | null;
  phone: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  liability_waiver_accepted_at: string | null;
  legal_documents_version: string | null;
};

export function isEmailVerified(user: User | null): boolean {
  return !!user?.email_confirmed_at;
}

export function isPhoneVerified(user: User | null): boolean {
  return !!user?.phone_confirmed_at;
}

export function hasProfileDetails(profile: ProfileRow | null): boolean {
  if (!profile) return false;
  return !!(
    profile.full_name?.trim() &&
    profile.city?.trim() &&
    profile.date_of_birth &&
    profile.gender &&
    profile.id_type &&
    profile.id_number?.trim() &&
    profile.avatar_url?.trim() &&
    profile.id_document_path?.trim()
  );
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

export function isOnboardingComplete(
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

export function getOnboardingRedirect(
  user: User | null,
  profile: ProfileRow | null
): "/profile/complete" | null {
  if (!user) return null;
  if (isOnboardingComplete(user, profile)) return null;
  return "/profile/complete";
}

export function resolvePostAuthRedirect(
  user: User | null,
  profile: ProfileRow | null,
  next: string | null | undefined
): string {
  const onboardingRedirect = getOnboardingRedirect(user, profile);
  if (onboardingRedirect) {
    const safeNext = getSafeNextPath(next);
    if (safeNext !== "/dashboard") {
      return `${onboardingRedirect}?next=${encodeURIComponent(safeNext)}`;
    }
    return onboardingRedirect;
  }
  return getSafeNextPath(next);
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
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `${defaultCountryCode}${digits.slice(1)}`;
  return `${defaultCountryCode}${digits}`;
}
