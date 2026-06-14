"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type SharedSubscription = {
  userId: string;
  channel: RealtimeChannel;
  listeners: Set<() => void>;
};

let sharedSubscription: SharedSubscription | null = null;

function notifySharedListeners() {
  sharedSubscription?.listeners.forEach((listener) => listener());
}

/** Reference-counted realtime subscription shared across notification hooks. */
export function subscribeToNotificationChanges(
  userId: string,
  listener: () => void
): () => void {
  const supabase = createClient();

  if (sharedSubscription && sharedSubscription.userId !== userId) {
    supabase.removeChannel(sharedSubscription.channel);
    sharedSubscription = null;
  }

  if (!sharedSubscription) {
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          notifySharedListeners();
        }
      )
      .subscribe();

    sharedSubscription = {
      userId,
      channel,
      listeners: new Set(),
    };
  }

  sharedSubscription.listeners.add(listener);

  return () => {
    if (!sharedSubscription) return;

    sharedSubscription.listeners.delete(listener);

    if (sharedSubscription.listeners.size === 0) {
      supabase.removeChannel(sharedSubscription.channel);
      sharedSubscription = null;
    }
  };
}
