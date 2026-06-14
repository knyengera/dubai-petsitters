import { createClient } from "@/lib/supabase/client";
import {
  resolvePostAuthRedirect,
  type ProfileRow,
} from "@/lib/auth/onboarding";
import { getProfile, userHasHostProfile } from "@/lib/profile/actions";

export async function getPostAuthRedirectPath(
  next: string | null | undefined
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getProfile();
  const hasHostProfile = profile ? await userHasHostProfile() : false;
  return resolvePostAuthRedirect(user, profile as ProfileRow | null, next, {
    hasHostProfile,
  });
}
