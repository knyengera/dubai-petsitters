import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminPath,
  isAdminRole,
  isGuestOnlyPath,
  isOnboardingExemptPath,
  isProtectedPath,
  isUserDashboardPath,
} from "@/lib/auth/routes";
import {
  isBaseOnboardingComplete,
  isHostSignup,
  isOnboardingComplete,
  resolvePostAuthRedirect,
  type ProfileRow,
} from "@/lib/auth/onboarding";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

const PROFILE_SELECT =
  "full_name, city, date_of_birth, gender, id_type, id_number, avatar_url, id_document_path, id_verification_status, profile_completed_at, phone_verified_at, phone, terms_accepted_at, privacy_accepted_at, liability_waiver_accepted_at, legal_documents_version, signup_account_type";

async function userHasHostProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
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

async function getOnboardingOptions(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  user: { id: string; email?: string | null },
  profile: ProfileRow | null
): Promise<{ hasHostProfile?: boolean }> {
  if (!isBaseOnboardingComplete(user, profile) || !isHostSignup(profile)) {
    return {};
  }
  const hasHostProfile = await userHasHostProfile(supabase, user);
  return { hasHostProfile };
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user) {
    const { data: accountStatus } = await supabase
      .from("profiles")
      .select("deactivated_at, deleted_at")
      .eq("id", user.id)
      .maybeSingle();

    // Soft-deleted accounts can never reach the app: sign out and bounce to
    // the login page with a reason so the UI can explain what happened.
    if (accountStatus?.deleted_at) {
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("reason", "deleted");
      const redirectResponse = NextResponse.redirect(loginUrl);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }

    // Deactivation is reversible: an authenticated visit reactivates the
    // account by clearing the flag and restoring the user's host listings.
    if (accountStatus?.deactivated_at) {
      const now = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({ deactivated_at: null, updated_at: now })
        .eq("id", user.id);
      await supabase
        .from("pet_hosts")
        .update({ is_available: true, updated_at: now })
        .eq("user_id", user.id);
      if (user.email) {
        await supabase
          .from("pet_hosts")
          .update({ is_available: true, updated_at: now })
          .eq("created_by", user.email);
      }
    }
  }

  if (user && isGuestOnlyPath(pathname)) {
    const next = request.nextUrl.searchParams.get("next");
    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    const onboardingOptions = await getOnboardingOptions(
      supabase,
      user,
      profile as ProfileRow | null
    );
    const redirectPath = resolvePostAuthRedirect(
      user,
      profile as ProfileRow | null,
      next,
      onboardingOptions
    );
    const redirectResponse = NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (isAdminPath(pathname) && user && !isAdminRole(user.app_metadata)) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && isAdminRole(user.app_metadata) && isUserDashboardPath(pathname)) {
    const redirectResponse = NextResponse.redirect(
      new URL("/admin", request.url)
    );
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (
    user &&
    isProtectedPath(pathname) &&
    !isOnboardingExemptPath(pathname)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    const onboardingOptions = await getOnboardingOptions(
      supabase,
      user,
      profile as ProfileRow | null
    );

    if (
      !isOnboardingComplete(user, profile as ProfileRow | null, onboardingOptions)
    ) {
      const completeUrl = request.nextUrl.clone();
      completeUrl.pathname = "/profile/complete";
      completeUrl.search = "";
      completeUrl.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(completeUrl);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
