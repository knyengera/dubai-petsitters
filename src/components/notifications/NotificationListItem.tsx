"use client";

import { formatDistanceToNow } from "date-fns";
import { renderInAppNotification } from "@/lib/notifications/templates";
import type { UserNotification } from "@/lib/notifications/types";

type NotificationListItemProps = {
  notification: UserNotification;
  onClick: (notification: UserNotification) => void;
  compact?: boolean;
};

export default function NotificationListItem({
  notification,
  onClick,
  compact = false,
}: NotificationListItemProps) {
  const content = renderInAppNotification(
    notification.template_key,
    notification.payload
  );
  const isUnread = !notification.read_at;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`w-full text-left transition-colors hover:bg-muted/50 ${
        compact ? "p-3" : "p-4"
      } ${isUnread ? "bg-primary/5" : ""}`}
    >
      <div className="flex items-start gap-3">
        {isUnread && (
          <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
        )}
        <div className={`flex-1 min-w-0 ${isUnread ? "" : "pl-5"}`}>
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm ${
                isUnread
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground"
              }`}
            >
              {content.title}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p
            className={`text-sm text-muted-foreground mt-1 ${
              compact ? "line-clamp-1" : "line-clamp-2"
            }`}
          >
            {content.body}
          </p>
        </div>
      </div>
    </button>
  );
}
