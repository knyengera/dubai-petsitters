"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import { useLanguage } from "@/lib/language-context";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import { renderInAppNotification } from "@/lib/notifications/templates";
import type { UserNotification } from "@/lib/notifications/types";
import { useUserNotifications } from "@/lib/notifications/use-user-notifications";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const router = useRouter();
  const { t } = useLanguage();
  const { notifications, isLoading, reload } = useUserNotifications();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await reload();
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    const content = renderInAppNotification(
      notification.template_key,
      notification.payload
    );

    if (!notification.read_at) {
      await markNotificationRead(notification.id);
    }

    router.push(content.actionUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-xl font-bold text-foreground">
            {t("Notifications", "الإشعارات")}
          </h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              {t("Mark all as read", "تعليم الكل كمقروء")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("Loading...", "جاري التحميل...")}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("No notifications yet.", "لا توجد إشعارات بعد.")}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
