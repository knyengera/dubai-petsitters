"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/notifications/config";
import {
  createVerificationSession,
  isStripeIdentityConfigured,
} from "@/lib/identity/stripe-identity";
import {
  generateToken,
  hashToken,
  recordVerificationSession,
  setProfileVerificationStatus,
} from "@/lib/identity/session-store";
import type { IdentityVerificationStatus } from "@/lib/identity/constants";

export type IdentityStatusResult = {
  status: IdentityVerificationStatus | null;
  error: string | null;
};

export type StartVerificationResult =
  | { success: true; verifyUrl: string; status: IdentityVerificationStatus }
  | { success: false; error: string };

export async function getIdentityVerificationStatus(): Promise<IdentityStatusResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: null, error: null };

  const { data } = await supabase
    .from("profiles")
    .select("id_verification_status, id_verification_error")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as {
    id_verification_status: IdentityVerificationStatus | null;
    id_verification_error: string | null;
  } | null;
  if (!row) return { status: null, error: null };

  return {
    status: row.id_verification_status ?? null,
    error: row.id_verification_error ?? null,
  };
}

/**
 * Creates a fresh Stripe Identity session for the current host and returns the
 * app URL to encode in the desktop QR code. Always issues a new session so a
 * "Refresh" action can recover from expired or failed attempts.
 */
export async function startIdentityVerification(): Promise<StartVerificationResult> {
  if (!isStripeIdentityConfigured()) {
    return { success: false, error: "Identity verification is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data } = await supabase
    .from("profiles")
    .select("signup_account_type, id_verification_status")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as {
    signup_account_type: string | null;
    id_verification_status: IdentityVerificationStatus | null;
  } | null;

  if (profile?.signup_account_type !== "host") {
    return { success: false, error: "Identity verification is only required for hosts." };
  }

  if (profile.id_verification_status === "verified") {
    return { success: true, verifyUrl: "", status: "verified" };
  }

  const baseUrl = getAppBaseUrl();
  const token = generateToken();

  try {
    const session = await createVerificationSession({
      userId: user.id,
      email: user.email,
      returnUrl: `${baseUrl}/verify/id/complete?s=${token}`,
    });

    await recordVerificationSession({
      userId: user.id,
      tokenHash: hashToken(token),
      stripeSessionId: session.id,
    });

    await setProfileVerificationStatus(user.id, {
      status: "pending",
      stripeSessionId: session.id,
      error: null,
    });

    revalidatePath("/profile/complete");

    return {
      success: true,
      verifyUrl: `${baseUrl}/verify/id?s=${token}`,
      status: "pending",
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to start verification.",
    };
  }
}
