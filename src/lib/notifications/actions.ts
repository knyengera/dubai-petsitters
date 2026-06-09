"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PREFERENCES } from "@/lib/notifications/preferences";
import type { NotificationPreferences } from "@/lib/notifications/types";

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) return data as NotificationPreferences;

  return {
    user_id: user.id,
    ...DEFAULT_PREFERENCES,
  };
}

export async function saveNotificationPreferences(
  input: Partial<Omit<NotificationPreferences, "user_id">>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // New table — cast until types are regenerated from Supabase CLI
  const { error } = await (supabase as unknown as { from: (t: string) => { upsert: (v: object, o: object) => Promise<{ error: { message: string } | null }> } })
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
