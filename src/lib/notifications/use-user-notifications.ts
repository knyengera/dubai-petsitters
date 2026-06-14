"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotifications } from "@/lib/notifications/actions";
import { subscribeToNotificationChanges } from "@/lib/notifications/notification-realtime";
import type { UserNotification } from "@/lib/notifications/types";

export function useUserNotifications(limit = 50) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const rows = await getUserNotifications(limit);
    setNotifications(rows);
    setIsLoading(false);
  }, [user, limit]);

  useEffect(() => {
    setIsLoading(true);
    reload();
  }, [reload]);

  useEffect(() => {
    if (!user) return;

    return subscribeToNotificationChanges(user.id, reload);
  }, [user, reload]);

  return { notifications, isLoading, reload };
}
