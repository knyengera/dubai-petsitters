import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/admin/service-client";
import type { IdentityVerificationStatus } from "@/lib/identity/constants";

/** Lifetime of a QR token before it must be regenerated. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type StoredVerificationSession = {
  id: string;
  user_id: string;
  stripe_session_id: string;
  status: IdentityVerificationStatus;
  expires_at: string;
};

export async function recordVerificationSession(params: {
  userId: string;
  tokenHash: string;
  stripeSessionId: string;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("identity_verification_sessions").insert({
    user_id: params.userId,
    token_hash: params.tokenHash,
    stripe_session_id: params.stripeSessionId,
    status: "pending",
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  } as never);
  if (error) throw new Error(error.message);
}

export async function findVerificationSessionByToken(
  token: string
): Promise<StoredVerificationSession | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("identity_verification_sessions")
    .select("id, user_id, stripe_session_id, status, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as StoredVerificationSession | null) ?? null;
}

export async function setSessionStatusByStripeId(
  stripeSessionId: string,
  status: IdentityVerificationStatus
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("identity_verification_sessions")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("stripe_session_id", stripeSessionId);
}

export async function setProfileVerificationStatus(
  userId: string,
  fields: {
    status: IdentityVerificationStatus;
    stripeSessionId?: string;
    error?: string | null;
    verifiedAt?: string | null;
  }
): Promise<void> {
  const supabase = createServiceClient();
  const update: Record<string, unknown> = {
    id_verification_status: fields.status,
    updated_at: new Date().toISOString(),
  };
  if (fields.stripeSessionId !== undefined) {
    update.stripe_verification_session_id = fields.stripeSessionId;
  }
  if (fields.error !== undefined) update.id_verification_error = fields.error;
  if (fields.verifiedAt !== undefined) update.id_verified_at = fields.verifiedAt;

  const { error } = await supabase
    .from("profiles")
    .update(update as never)
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
