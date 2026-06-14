import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isBaseOnboardingComplete,
  isHostSignup,
  resolvePostAuthRedirect,
  type ProfileRow,
} from "@/lib/auth/onboarding";

const PROFILE_SELECT =
  "full_name, city, date_of_birth, gender, id_type, id_number, avatar_url, id_document_path, profile_completed_at, phone_verified_at, phone, terms_accepted_at, privacy_accepted_at, liability_waiver_accepted_at, legal_documents_version, signup_account_type";

async function userHasHostProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null }
): Promise<boolean> {
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile: ProfileRow | null = null;
    let hasHostProfile = false;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();
      profile = data as ProfileRow | null;

      if (isBaseOnboardingComplete(user, profile) && isHostSignup(profile)) {
        hasHostProfile = await userHasHostProfile(supabase, user);
      }
    }

    const redirectPath = resolvePostAuthRedirect(user, profile, next, {
      hasHostProfile,
    });
    return NextResponse.redirect(`${origin}${redirectPath}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
