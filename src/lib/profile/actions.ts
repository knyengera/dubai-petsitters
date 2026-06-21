"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SignupAccountType } from "@/lib/auth/constants";
import {
  hasProfileDetails,
  type ProfileRow,
  validateNationalId,
  validatePassport,
} from "@/lib/auth/onboarding";

export type ProfileDetailsInput = {
  full_name: string;
  city: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  id_type: "national_id" | "passport";
  id_number: string;
  avatar_url: string;
  id_document_path: string;
};

function validateProfileInput(
  input: ProfileDetailsInput,
  accountType: SignupAccountType,
  options?: { skipIdFormat?: boolean }
): string | null {
  if (!input.full_name.trim()) return "Full name is required.";
  if (!input.city.trim()) return "City is required.";
  if (!input.date_of_birth) return "Date of birth is required.";
  if (!input.gender) return "Gender is required.";
  if (!input.id_type) return "ID type is required.";
  if (!input.id_number.trim()) return "ID number is required.";
  if (!input.avatar_url.trim()) return "Profile photo is required.";
  // Hosts verify their ID via Stripe Identity in a separate step.
  if (accountType !== "host" && !input.id_document_path.trim()) {
    return "ID document upload is required.";
  }

  // For verified hosts the ID number comes straight from the document Stripe
  // verified, so we trust it rather than enforcing our manual-entry formats.
  if (!options?.skipIdFormat) {
    if (input.id_type === "national_id" && !validateNationalId(input.id_number)) {
      return "National ID must be exactly 10 digits.";
    }
    if (input.id_type === "passport" && !validatePassport(input.id_number)) {
      return "Passport number must be 6–12 alphanumeric characters.";
    }
  }

  const dob = new Date(input.date_of_birth);
  if (Number.isNaN(dob.getTime())) return "Invalid date of birth.";
  const ageMs = Date.now() - dob.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 18) return "You must be at least 18 years old.";
  if (ageYears > 120) return "Invalid date of birth.";

  return null;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, city, date_of_birth, gender, id_type, id_number, avatar_url, id_document_path, id_verification_status, id_verified_at, profile_completed_at, phone_verified_at, phone, terms_accepted_at, privacy_accepted_at, liability_waiver_accepted_at, legal_documents_version, signup_account_type"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRow | null;
}

export async function saveProfileDetails(
  input: ProfileDetailsInput
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("profiles")
    .select(
      "signup_account_type, id_verification_status, date_of_birth, gender, id_type, id_number"
    )
    .eq("id", user.id)
    .maybeSingle();
  const existingRow = existing as {
    signup_account_type: string | null;
    id_verification_status: string | null;
    date_of_birth: string | null;
    gender: string | null;
    id_type: string | null;
    id_number: string | null;
  } | null;
  const accountType: SignupAccountType =
    existingRow?.signup_account_type === "host" ? "host" : "client";

  // Verified hosts have their ID details captured from Stripe Identity. We keep
  // those as the source of truth instead of overwriting them with form input.
  const isHostVerified =
    accountType === "host" && existingRow?.id_verification_status === "verified";

  const validationError = validateProfileInput(input, accountType, {
    skipIdFormat: isHostVerified,
  });
  if (validationError) return { success: false, error: validationError };

  const dateOfBirth =
    isHostVerified && existingRow?.date_of_birth
      ? existingRow.date_of_birth
      : input.date_of_birth;
  const gender =
    isHostVerified && existingRow?.gender
      ? (existingRow.gender as ProfileDetailsInput["gender"])
      : input.gender;
  const idType =
    isHostVerified && existingRow?.id_type
      ? (existingRow.id_type as ProfileDetailsInput["id_type"])
      : input.id_type;
  const idNumber =
    isHostVerified && existingRow?.id_number
      ? existingRow.id_number
      : input.id_number.trim();

  const profilePayload = {
    full_name: input.full_name.trim(),
    city: input.city.trim(),
    date_of_birth: dateOfBirth,
    gender,
    id_type: idType,
    id_number: idNumber,
    avatar_url: input.avatar_url.trim(),
    id_document_path: input.id_document_path.trim(),
    updated_at: new Date().toISOString(),
  };

  const draftProfile: ProfileRow = {
    ...profilePayload,
    id_verification_status: null,
    id_verified_at: null,
    profile_completed_at: null,
    phone: null,
    phone_verified_at: null,
    terms_accepted_at: null,
    privacy_accepted_at: null,
    liability_waiver_accepted_at: null,
    legal_documents_version: null,
    signup_account_type: accountType,
  };

  if (!hasProfileDetails(draftProfile)) {
    return { success: false, error: "Profile details are incomplete." };
  }

  const { error } = await supabase
    .from("profiles")
    .update(profilePayload)
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  await supabase.auth.updateUser({
    data: { full_name: input.full_name.trim() },
  });

  revalidatePath("/profile/complete");
  revalidatePath("/profile/edit");
  revalidatePath("/settings");
  return { success: true };
}

export async function syncPhoneVerified(
  phone: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };
  if (!user.phone_confirmed_at) {
    return { success: false, error: "Phone is not verified yet." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      phone: phone.trim(),
      phone_verified_at: new Date().toISOString(),
      profile_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profile/complete");
  return { success: true };
}

export async function saveSignupAccountType(
  type: SignupAccountType
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("signup_account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };
  if (existing?.signup_account_type) return { success: true };

  const { error } = await supabase
    .from("profiles")
    .update({
      signup_account_type: type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profile/complete");
  return { success: true };
}

export async function userHasHostProfile(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: byUserId } = await supabase
    .from("pet_hosts")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (byUserId) return true;

  if (!user.email) return false;

  const { data: byEmail } = await supabase
    .from("pet_hosts")
    .select("id")
    .eq("created_by", user.email)
    .limit(1)
    .maybeSingle();

  return !!byEmail;
}
