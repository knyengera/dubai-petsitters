import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";
import { shouldSendNotification } from "@/lib/notifications/preferences";
import { renderNotification } from "@/lib/notifications/templates";
import { sendEmail } from "@/lib/notifications/send-email";
import { sendTwilioSms } from "@/lib/notifications/twilio-sms";
import type {
  NotificationOutboxRow,
  NotificationPreferences,
} from "@/lib/notifications/types";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

async function loadPreferences(
  userId: string | null
): Promise<NotificationPreferences | null> {
  if (!userId || !hasServiceRole()) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as NotificationPreferences | null) ?? null;
}

async function shouldSkipMessageNotification(
  row: NotificationOutboxRow
): Promise<string | null> {
  if (row.event_type !== "message.new") return null;
  const messageId = row.payload.message_id;
  if (!messageId || !hasServiceRole()) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("messages")
    .select("read")
    .eq("id", String(messageId))
    .maybeSingle();

  if (data && (data as { read: boolean }).read) {
    return "Message already read";
  }
  return null;
}

async function processRow(row: NotificationOutboxRow): Promise<{
  status: "sent" | "failed" | "skipped";
  error?: string;
  providerRef?: string;
}> {
  const skipReason = await shouldSkipMessageNotification(row);
  if (skipReason) {
    return { status: "skipped", error: skipReason };
  }

  const prefs = await loadPreferences(row.recipient_user_id);
  if (!shouldSendNotification(prefs, row.event_type, row.channel)) {
    return { status: "skipped", error: "Disabled by user preferences" };
  }

  const rendered = renderNotification(
    row.template_key,
    row.channel,
    row.payload
  );

  if (row.channel === "email") {
    if (!row.recipient_email) {
      return { status: "skipped", error: "No recipient email" };
    }
    const result = await sendEmail({
      to: row.recipient_email,
      subject: rendered.subject || "Dubai Petsitters",
      text: rendered.text,
      html: rendered.html,
    });
    if (!result.ok) return { status: "failed", error: result.error };
    return { status: "sent", providerRef: result.providerRef };
  }

  if (!row.recipient_phone) {
    return { status: "skipped", error: "No recipient phone" };
  }
  const result = await sendTwilioSms({
    to: row.recipient_phone,
    body: rendered.text,
  });
  if (!result.ok) return { status: "failed", error: result.error };
  return { status: "sent", providerRef: result.sid };
}

export async function dispatchPendingNotifications(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
}> {
  if (!hasServiceRole()) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: "Service role not configured",
    };
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  type OutboxClient = {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => {
          lte: (c: string, v: string) => {
            order: (c: string, o: object) => {
              limit: (n: number) => Promise<{ data: NotificationOutboxRow[] | null; error: { message: string } | null }>;
            };
          };
        };
      };
      update: (v: object) => { eq: (c: string, v: string) => Promise<unknown> };
    };
    rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const db = supabase as unknown as OutboxClient;

  const { data: rows, error } = await db
    .from("notification_outbox")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: error.message,
    };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const raw of rows ?? []) {
    const row = raw as NotificationOutboxRow;
    const result = await processRow(row);
    const attempts = row.attempts + 1;

    if (result.status === "sent") {
      sent++;
      await db
        .from("notification_outbox")
        .update({
          status: "sent",
          attempts,
          sent_at: new Date().toISOString(),
          provider_ref: result.providerRef ?? null,
          last_error: null,
        })
        .eq("id", row.id);
      continue;
    }

    if (result.status === "skipped") {
      skipped++;
      await db
        .from("notification_outbox")
        .update({
          status: "skipped",
          attempts,
          last_error: result.error ?? null,
        })
        .eq("id", row.id);
      continue;
    }

    failed++;
    const finalFailed = attempts >= MAX_ATTEMPTS;
    await db
      .from("notification_outbox")
      .update({
        status: finalFailed ? "failed" : "pending",
        attempts,
        last_error: result.error ?? "Unknown error",
        scheduled_for: finalFailed
          ? row.scheduled_for
          : new Date(Date.now() + attempts * 60_000).toISOString(),
      })
      .eq("id", row.id);
  }

  return {
    processed: rows?.length ?? 0,
    sent,
    failed,
    skipped,
  };
}

export async function enqueuePetHealthReminders(): Promise<number> {
  if (!hasServiceRole()) return 0;
  const supabase = createServiceClient();
  const { data, error } = await (
    supabase as unknown as {
      rpc(fn: string): Promise<{ data: unknown; error: { message: string } | null }>;
    }
  ).rpc("notification_enqueue_pet_health_reminders");
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
