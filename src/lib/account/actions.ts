"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Hide every host listing owned by the user. Host listings are matched both by
 * the newer `user_id` FK and the legacy email-based `created_by` column. The
 * RLS-scoped client can update these rows via the `pet_hosts_owner_update`
 * policy (created_by = auth email).
 */
async function hideUserHostListings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null },
  available: boolean
): Promise<void> {
  await supabase
    .from("pet_hosts")
    .update({ is_available: available, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (user.email) {
    await supabase
      .from("pet_hosts")
      .update({ is_available: available, updated_at: new Date().toISOString() })
      .eq("created_by", user.email);
  }
}

/**
 * Reversible pause. Flags the profile as deactivated, hides the user's host
 * listings, then signs out. Logging back in auto-reactivates (see middleware).
 */
export async function deactivateAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({
      deactivated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  await hideUserHostListings(supabase, user, false);
  await supabase.auth.signOut();

  return { success: true };
}

/**
 * Soft delete. Marks the profile as deleted (and deactivated), hides the user's
 * host listings, then signs out. Middleware blocks any future login for a
 * profile with `deleted_at` set. Auth user and records are retained.
 */
export async function softDeleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: now,
      deactivated_at: now,
      updated_at: now,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  await hideUserHostListings(supabase, user, false);
  await supabase.auth.signOut();

  return { success: true };
}
