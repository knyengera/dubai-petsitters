import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

function basicAuth(): string {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const token = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  return btoa(`${sid}:${token}`);
}

async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const from = Deno.env.get("TWILIO_EMAIL_FROM");
  const fromName = Deno.env.get("TWILIO_EMAIL_FROM_NAME") ?? "Saudi Petsitters";
  if (!from) return { ok: false, error: "TWILIO_EMAIL_FROM not set" };

  const res = await fetch("https://comms.twilio.com/v1/Emails", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { address: from, name: fromName },
      to: [{ address: to }],
      content: { subject, text, ...(html ? { html } : {}) },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.message || res.statusText };
  return { ok: true, ref: data.operationId as string | undefined };
}

async function sendSms(to: string, body: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const msid = Deno.env.get("TWILIO_MESSAGE_SERVICE_SID");
  if (!sid || !msid) return { ok: false, error: "Twilio SMS not configured" };

  const params = new URLSearchParams({
    To: to,
    MessagingServiceSid: msid,
    Body: body,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.message || res.statusText };
  return { ok: true, ref: data.sid as string | undefined };
}

function renderText(templateKey: string, payload: Record<string, unknown>): string {
  const pet = String(payload.pet_name ?? "your pet");
  switch (templateKey) {
    case "booking.request":
      return `New booking request for ${pet}.`;
    case "booking.confirmed":
    case "booking.confirmed.host":
      return `Booking confirmed for ${pet}.`;
    case "payment.confirmed":
      return `Payment of ${payload.amount} ${payload.currency ?? "SAR"} received.`;
    case "message.new":
      return `New message from ${payload.sender_name ?? "someone"}.`;
    default:
      return String(payload.text ?? "You have a new notification from Saudi Petsitters.");
  }
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
    });
  }

  const supabase = createClient(url, key);
  const now = new Date().toISOString();

  await supabase.rpc("notification_enqueue_pet_health_reminders");

  const { data: rows, error } = await supabase
    .from("notification_outbox")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    const text = renderText(row.template_key, row.payload ?? {});
    let result: { ok: boolean; error?: string; ref?: string };

    if (row.channel === "email" && row.recipient_email) {
      result = await sendEmail(
        row.recipient_email,
        "Saudi Petsitters",
        text
      );
    } else if (row.channel === "sms" && row.recipient_phone) {
      result = await sendSms(row.recipient_phone, text);
    } else {
      await supabase
        .from("notification_outbox")
        .update({ status: "skipped", last_error: "Missing recipient" })
        .eq("id", row.id);
      continue;
    }

    const attempts = (row.attempts ?? 0) + 1;
    if (result.ok) {
      sent++;
      await supabase
        .from("notification_outbox")
        .update({
          status: "sent",
          attempts,
          sent_at: new Date().toISOString(),
          provider_ref: result.ref ?? null,
        })
        .eq("id", row.id);
    } else {
      failed++;
      const finalFailed = attempts >= MAX_ATTEMPTS;
      await supabase
        .from("notification_outbox")
        .update({
          status: finalFailed ? "failed" : "pending",
          attempts,
          last_error: result.error ?? "Send failed",
        })
        .eq("id", row.id);
    }
  }

  return new Response(
    JSON.stringify({ processed: rows?.length ?? 0, sent, failed }),
    { headers: { "Content-Type": "application/json" } }
  );
});
