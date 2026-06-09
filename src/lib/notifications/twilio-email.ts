import { getTwilioConfig } from "@/lib/notifications/config";

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  ok: boolean;
  operationId?: string;
  error?: string;
}

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
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.message || `Twilio Email failed (${res.status})`,
      };
    }

    return { ok: true, operationId: data.operationId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Twilio Email request failed",
    };
  }
}
