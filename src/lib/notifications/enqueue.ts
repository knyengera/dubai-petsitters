import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";

export async function enqueueNotification(input: {
  eventType: string;
  channel: "email" | "sms";
  templateKey: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  recipientUserId?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  scheduledFor?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!hasServiceRole()) {
    return { ok: false, error: "Service role not configured" };
  }

  try {
    const supabase = createServiceClient();
    const client = supabase as unknown as {
      rpc(
        fn: string,
        args: Record<string, unknown>
      ): Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await client.rpc("enqueue_notification", {
      p_event_type: input.eventType,
      p_channel: input.channel,
      p_template_key: input.templateKey,
      p_idempotency_key: input.idempotencyKey,
      p_payload: input.payload ?? {},
      p_recipient_user_id: input.recipientUserId ?? null,
      p_recipient_email: input.recipientEmail ?? null,
      p_recipient_phone: input.recipientPhone ?? null,
      p_scheduled_for: input.scheduledFor ?? new Date().toISOString(),
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data as string | undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to enqueue notification",
    };
  }
}
