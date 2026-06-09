export type NotificationChannel = "email" | "sms";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export type NotificationEventType =
  | "booking.request"
  | "booking.confirmed"
  | "payment.confirmed"
  | "message.new"
  | "appointment.request"
  | "appointment.status"
  | "adoption.received"
  | "payout.status"
  | "escrow.released"
  | "reminder.pet_health";

export type NotificationCategory =
  | "booking"
  | "payment"
  | "message"
  | "appointment"
  | "reminder"
  | "marketing";

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  booking_email: boolean;
  booking_sms: boolean;
  payment_email: boolean;
  payment_sms: boolean;
  message_email: boolean;
  message_sms: boolean;
  appointment_email: boolean;
  appointment_sms: boolean;
  reminder_email: boolean;
  reminder_sms: boolean;
  marketing_email: boolean;
  marketing_sms: boolean;
}

export interface NotificationOutboxRow {
  id: string;
  event_type: string;
  channel: NotificationChannel;
  recipient_user_id: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  template_key: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: NotificationStatus;
  attempts: number;
  last_error: string | null;
  provider_ref: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
}

export interface RenderedNotification {
  subject?: string;
  html?: string;
  text: string;
}

export function eventCategory(eventType: string): NotificationCategory | null {
  if (eventType.startsWith("booking.")) return "booking";
  if (eventType.startsWith("payment.")) return "payment";
  if (eventType.startsWith("message.")) return "message";
  if (eventType.startsWith("appointment.")) return "appointment";
  if (eventType.startsWith("reminder.")) return "reminder";
  if (eventType.startsWith("adoption.") || eventType.startsWith("payout.") || eventType.startsWith("escrow.")) {
    return "booking";
  }
  return null;
}
