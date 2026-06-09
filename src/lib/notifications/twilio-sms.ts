import { getTwilioConfig } from "@/lib/notifications/config";

export interface SendSmsInput {
  to: string;
  body: string;
}

export interface SendSmsResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

export async function sendTwilioSms(input: SendSmsInput): Promise<SendSmsResult> {
  const { accountSid, authToken, messageServiceSid, isSmsConfigured } =
    getTwilioConfig();

  if (!isSmsConfigured || !accountSid || !authToken || !messageServiceSid) {
    return { ok: false, error: "Twilio SMS is not configured" };
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const params = new URLSearchParams({
    To: input.to,
    MessagingServiceSid: messageServiceSid,
    Body: input.body,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.message || `Twilio SMS failed (${res.status})`,
      };
    }

    return { ok: true, sid: data.sid };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Twilio SMS request failed",
    };
  }
}
