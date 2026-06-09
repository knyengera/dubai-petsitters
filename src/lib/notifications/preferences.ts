import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPreferences,
} from "@/lib/notifications/types";
import { eventCategory } from "@/lib/notifications/types";

export function shouldSendNotification(
  prefs: NotificationPreferences | null,
  eventType: string,
  channel: NotificationChannel
): boolean {
  if (!prefs) return true;

  if (channel === "email" && !prefs.email_enabled) return false;
  if (channel === "sms" && !prefs.sms_enabled) return false;

  const category = eventCategory(eventType);
  if (!category) return true;

  const key = `${category}_${channel}` as keyof NotificationPreferences;
  const value = prefs[key];
  return typeof value === "boolean" ? value : true;
}

export const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "user_id"> = {
  email_enabled: true,
  sms_enabled: true,
  booking_email: true,
  booking_sms: true,
  payment_email: true,
  payment_sms: true,
  message_email: true,
  message_sms: false,
  appointment_email: true,
  appointment_sms: true,
  reminder_email: true,
  reminder_sms: false,
  marketing_email: false,
  marketing_sms: false,
};
