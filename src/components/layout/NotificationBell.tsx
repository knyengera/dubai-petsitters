"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import NotificationListItem from "@/components/notifications/NotificationListItem";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { markNotificationRead } from "@/lib/notifications/actions";
import { renderInAppNotification } from "@/lib/notifications/templates";
import type { UserNotification } from "@/lib/notifications/types";
import { useNotificationCount } from "@/lib/notifications/use-notification-count";
import { useUserNotifications } from "@/lib/notifications/use-user-notifications";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  className?: string;
};

export default function NotificationBell({ className }: NotificationBellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { count, isLoading } = useNotificationCount();
  const { notifications, isLoading: listLoading } = useUserNotifications(5);
  const [open, setOpen] = useState(false);

  const badgeLabel = count > 99 ? "99+" : String(count);
  const ariaLabel =
    count > 0
      ? t(`${count} unread notifications`, `${count} إشعارات غير مقروءة`)
      : t("Notifications", "الإشعارات");

  const handleNotificationClick = async (notification: UserNotification) => {
    const content = renderInAppNotification(
      notification.template_key,
      notification.payload
    );

    if (!notification.read_at) {
      await markNotificationRead(notification.id);
    }

    setOpen(false);
    router.push(content.actionUrl);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={`relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          pathname === "/notifications" ? "bg-primary/10 text-primary" : ""
        } ${className ?? ""}`}
      >
        <Bell className="w-5 h-5" />
        {!isLoading && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary/70 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {badgeLabel}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 sm:w-96 p-0">
        <PopoverHeader className="px-4 py-3 border-b border-border">
          <PopoverTitle className="font-heading text-sm font-semibold">
            {t("Notifications", "الإشعارات")}
          </PopoverTitle>
        </PopoverHeader>

        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {listLoading ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              {t("Loading...", "جاري التحميل...")}
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              {t("No notifications yet.", "لا توجد إشعارات بعد.")}
            </p>
          ) : (
            notifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
                compact
              />
            ))
          )}
        </div>

        <div className="p-2 border-t border-border">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
          >
            {t("View all", "عرض الكل")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
