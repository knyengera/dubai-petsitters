import { createClient } from "@/lib/supabase/server";

export type AuthVerificationSettings = {
  emailVerificationEnabled: boolean;
  phoneVerificationEnabled: boolean;
  googleOauthEnabled: boolean;
  appleOauthEnabled: boolean;
};

const DEFAULTS: AuthVerificationSettings = {
  emailVerificationEnabled: true,
  phoneVerificationEnabled: true,
  googleOauthEnabled: true,
  appleOauthEnabled: true,
};

function parseSettings(row: Record<string, unknown> | null): AuthVerificationSettings {
  if (!row) return DEFAULTS;
  return {
    emailVerificationEnabled: row.email_verification_enabled !== false,
    phoneVerificationEnabled: row.phone_verification_enabled !== false,
    googleOauthEnabled: row.google_oauth_enabled !== false,
    appleOauthEnabled: row.apple_oauth_enabled !== false,
  };
}

export async function getAuthVerificationSettings(): Promise<AuthVerificationSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_auth_verification_settings");

  if (error) {
    const { data: fallback } = await supabase
      .from("platform_auth_settings")
      .select(
        "email_verification_enabled, phone_verification_enabled, google_oauth_enabled, apple_oauth_enabled"
      )
      .limit(1)
      .maybeSingle();

    return parseSettings(fallback as Record<string, unknown> | null);
  }

  return parseSettings(data as Record<string, unknown> | null);
}
