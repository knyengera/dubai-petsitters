"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PREFERENCES } from "@/lib/notifications/preferences";
import type {
  NotificationEventType,
  NotificationPreferences,
  UserNotification,
} from "@/lib/notifications/types";

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

function mapUserNotification(row: Record<string, unknown>): UserNotification {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    event_type: row.event_type as NotificationEventType,
    template_key: String(row.template_key),
    payload: (row.payload as Record<string, unknown>) ?? {},
    read_at: row.read_at ? String(row.read_at) : null,
    created_at: String(row.created_at),
  };
}

export async function getUserNotifications(limit = 50): Promise<UserNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => mapUserNotification(row as Record<string, unknown>));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const readAt = new Date().toISOString();
  const { error } = await (
    supabase as unknown as {
      from: (table: string) => {
        update: (values: { read_at: string }) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => {
              is: (col: string, val: null) => Promise<{ error: { message: string } | null }>;
            };
          };
        };
      };
    }
  )
    .from("user_notifications")
    .update({ read_at: readAt })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const readAt = new Date().toISOString();
  const { error } = await (
    supabase as unknown as {
      from: (table: string) => {
        update: (values: { read_at: string }) => {
          eq: (col: string, val: string) => {
            is: (col: string, val: null) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
    }
  )
    .from("user_notifications")
    .update({ read_at: readAt })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
