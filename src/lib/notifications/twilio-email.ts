import { getTwilioConfig } from "@/lib/notifications/config";
import type { SendEmailInput, SendEmailResult } from "@/lib/notifications/email-types";

export type { SendEmailInput, SendEmailResult } from "@/lib/notifications/email-types";

export async function sendTwilioEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { accountSid, authToken, emailFrom, emailFromName, isEmailConfigured } =
    getTwilioConfig();

  if (!isEmailConfigured || !accountSid || !authToken || !emailFrom) {
    return { ok: false, error: "Twilio Email is not configured" };
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const body = {
    from: {
      address: emailFrom,
      name: emailFromName,
    },
    to: [
      {
        address: input.to,
        ...(input.toName ? { name: input.toName } : {}),
      },
    ],
    content: {
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    },
  };

  try {
    const res = await fetch("https://comms.twilio.com/v1/Emails", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as {
      operationId?: string;
      message?: string;
      detail?: string;
      title?: string;
      errors?: Array<{ message?: string; detail?: string }>;
    };

    if (!res.ok) {
      const parts = [
        data.message,
        data.detail,
        data.title,
        ...(data.errors?.map((e) => e.message || e.detail) ?? []),
      ].filter(Boolean);
      return {
        ok: false,
        error:
          parts.join(" — ") ||
          `Twilio Email failed (${res.status})`,
      };
    }

    return {
      ok: true,
      provider: "twilio",
      providerRef: data.operationId,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Twilio Email request failed",
    };
  }
}
