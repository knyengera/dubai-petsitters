import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminPath,
  isAdminRole,
  isOnboardingExemptPath,
  isProtectedPath,
} from "@/lib/auth/routes";
import {
  isOnboardingComplete,
  type ProfileRow,
} from "@/lib/auth/onboarding";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
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

  if (
    user &&
    isProtectedPath(pathname) &&
    !isOnboardingExemptPath(pathname)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, city, date_of_birth, gender, id_type, id_number, avatar_url, id_document_path, profile_completed_at, phone_verified_at, phone"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (!isOnboardingComplete(user, profile as ProfileRow | null)) {
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
