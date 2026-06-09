import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  resolvePostAuthRedirect,
  type ProfileRow,
} from "@/lib/auth/onboarding";

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
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, city, date_of_birth, gender, id_type, id_number, avatar_url, id_document_path, profile_completed_at, phone_verified_at, phone"
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = data as ProfileRow | null;
    }

    const redirectPath = resolvePostAuthRedirect(user, profile, next);
    return NextResponse.redirect(`${origin}${redirectPath}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
