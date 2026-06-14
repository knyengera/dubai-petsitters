"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeToNotificationChanges } from "@/lib/notifications/notification-realtime";
import { createClient } from "@/lib/supabase/client";

export type NotificationCountState = {
  count: number;
  isLoading: boolean;
};

export function useNotificationCount(): NotificationCountState {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { count: unreadCount, error } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (!error) {
      setCount(unreadCount ?? 0);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    if (!user) return;

    return subscribeToNotificationChanges(user.id, fetchCount);
  }, [user, fetchCount]);

  return { count, isLoading };
}
