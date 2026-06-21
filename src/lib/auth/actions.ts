"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";
import { autoConfirmEmail, autoConfirmPhone } from "@/lib/auth/auto-verify";
import {
  getAuthVerificationSettings,
  type AuthVerificationSettings,
} from "@/lib/auth/verification-settings";
import { isValidE164Phone, toE164Phone } from "@/lib/auth/onboarding";
import { createClient } from "@/lib/supabase/server";

export type PlatformAuthSettingsRow = {
  id: string;
  email_verification_enabled: boolean;
  phone_verification_enabled: boolean;
  google_oauth_enabled: boolean;
  apple_oauth_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type AuthActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toError(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

export async function getVerificationSettingsForClient(): Promise<AuthVerificationSettings> {
  return getAuthVerificationSettings();
}

export async function autoConfirmEmailIfDisabled(input?: {
  userId?: string;
  email?: string;
}): Promise<{ confirmed: boolean }> {
  const settings = await getAuthVerificationSettings();
  if (settings.emailVerificationEnabled) {
    return { confirmed: false };
  }

  if (!hasServiceRole()) {
    return { confirmed: false };
  }

  let targetUserId: string | undefined;

  if (input?.userId && input?.email) {
    const service = createServiceClient();
    const { data, error } = await service.auth.admin.getUserById(input.userId);
    if (error || !data.user) return { confirmed: false };
    if (data.user.email?.toLowerCase() !== input.email.toLowerCase()) {
      return { confirmed: false };
    }
    if (data.user.email_confirmed_at) return { confirmed: true };
    targetUserId = input.userId;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { confirmed: false };
    if (user.email_confirmed_at) return { confirmed: true };
    targetUserId = user.id;
  }

  await autoConfirmEmail(targetUserId);
  return { confirmed: true };
}

export async function savePhoneWithoutVerification(
  phone: string
): Promise<{ success: true } | { success: false; error: string }> {
  const settings = await getAuthVerificationSettings();
  if (settings.phoneVerificationEnabled) {
    return { success: false, error: "Phone SMS verification is required." };
  }

  if (!isValidE164Phone(phone)) {
    return { success: false, error: "Invalid phone number." };
  }

  const e164 = toE164Phone(phone);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (!hasServiceRole()) {
    return { success: false, error: "Phone auto-verification is unavailable." };
  }

  try {
    await autoConfirmPhone(user.id, e164);
  } catch (e) {
    return { success: false, error: toError(e) };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      phone: e164,
      phone_verified_at: now,
      profile_completed_at: now,
      updated_at: now,
    } as never)
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profile/complete");
  return { success: true };
}

export async function adminGetAuthSettings(): Promise<
  AuthActionResult<PlatformAuthSettingsRow>
> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_auth_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Auth settings not found" };
    return { ok: true, data: data as PlatformAuthSettingsRow };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpdateAuthSettings(input: {
  emailVerificationEnabled?: boolean;
  phoneVerificationEnabled?: boolean;
  googleOauthEnabled?: boolean;
  appleOauthEnabled?: boolean;
}): Promise<AuthActionResult<PlatformAuthSettingsRow>> {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: admin.email,
    };
    if (input.emailVerificationEnabled !== undefined) {
      updates.email_verification_enabled = input.emailVerificationEnabled;
    }
    if (input.phoneVerificationEnabled !== undefined) {
      updates.phone_verification_enabled = input.phoneVerificationEnabled;
    }
    if (input.googleOauthEnabled !== undefined) {
      updates.google_oauth_enabled = input.googleOauthEnabled;
    }
    if (input.appleOauthEnabled !== undefined) {
      updates.apple_oauth_enabled = input.appleOauthEnabled;
    }

    const { data: existing, error: existingError } = await supabase
      .from("platform_auth_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existingError) return { ok: false, error: existingError.message };

    const existingRow = existing as { id: string } | null;

    let data: PlatformAuthSettingsRow | null = null;
    let error: { message: string } | null = null;

    if (existingRow?.id) {
      const result = await supabase
        .from("platform_auth_settings")
        .update(updates as never)
        .eq("id", existingRow.id)
        .select()
        .single();
      data = result.data as PlatformAuthSettingsRow | null;
      error = result.error;
    } else {
      const result = await supabase
        .from("platform_auth_settings")
        .insert(updates as never)
        .select()
        .single();
      data = result.data as PlatformAuthSettingsRow | null;
      error = result.error;
    }

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/auth-settings");
    return { ok: true, data: data as PlatformAuthSettingsRow };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
