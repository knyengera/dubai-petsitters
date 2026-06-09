"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_DOCUMENTS_VERSION } from "@/lib/legal/constants";
import type { ProfileRow } from "@/lib/auth/onboarding";

export async function recordLegalAcceptance(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error: fetchError } = await supabase
    .from("profiles")
    .select(
      "terms_accepted_at, privacy_accepted_at, liability_waiver_accepted_at, legal_documents_version"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };

  const profile = data as Pick<
    ProfileRow,
    | "terms_accepted_at"
    | "privacy_accepted_at"
    | "liability_waiver_accepted_at"
    | "legal_documents_version"
  > | null;

  if (
    profile?.terms_accepted_at &&
    profile.privacy_accepted_at &&
    profile.liability_waiver_accepted_at &&
    profile.legal_documents_version === LEGAL_DOCUMENTS_VERSION
  ) {
    return { success: true };
  }

  const now = new Date().toISOString();
  const updateSupabase = await createClient();
  const { error } = await (
    updateSupabase.from("profiles") as unknown as {
      update: (values: Record<string, unknown>) => {
        eq: (
          column: string,
          value: string
        ) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update({
      terms_accepted_at: now,
      privacy_accepted_at: now,
      liability_waiver_accepted_at: now,
      legal_documents_version: LEGAL_DOCUMENTS_VERSION,
      updated_at: now,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profile/complete");
  return { success: true };
}
