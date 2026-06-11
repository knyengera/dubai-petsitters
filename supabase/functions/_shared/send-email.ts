import nodemailer from "npm:nodemailer@6";

export interface SendEmailResult {
  ok: boolean;
  provider?: "twilio" | "smtp";
  ref?: string;
  error?: string;
}

function getTwilioEmailConfig() {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const emailFrom = Deno.env.get("TWILIO_EMAIL_FROM");
  const emailFromName = Deno.env.get("TWILIO_EMAIL_FROM_NAME") ?? "Saudi Petsitters";
  return {
    accountSid,
    authToken,
    emailFrom,
    emailFromName,
    isConfigured: Boolean(accountSid && authToken && emailFrom),
  };
}

function getSmtpConfig() {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? 587);
  const user = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASSWORD");
  const from = Deno.env.get("SMTP_FROM");
  const fromName = Deno.env.get("SMTP_FROM_NAME") ?? "Saudi Petsitters";
  return {
    host,
    port,
    user,
    password,
    from,
    fromName,
    isConfigured: Boolean(host && port && user && password && from),
  };
}

function basicAuth(): string {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const token = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  return btoa(`${sid}:${token}`);
}

async function sendTwilioEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<SendEmailResult> {
  const { emailFrom, emailFromName, isConfigured } = getTwilioEmailConfig();
  if (!isConfigured || !emailFrom) {
    return { ok: false, error: "Twilio Email is not configured" };
  }

  try {
    const res = await fetch("https://comms.twilio.com/v1/Emails", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { address: emailFrom, name: emailFromName },
        to: [{ address: to }],
        content: { subject, text, ...(html ? { html } : {}) },
      }),
    });

    const data = await res.json().catch(() => ({})) as {
      operationId?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.message || `Twilio Email failed (${res.status})`,
      };
    }

    return { ok: true, provider: "twilio", ref: data.operationId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Twilio Email request failed",
    };
  }
}

async function sendSmtpEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<SendEmailResult> {
  const { host, port, user, password, from, fromName, isConfigured } =
    getSmtpConfig();

  if (!isConfigured || !host || !user || !password || !from) {
    return { ok: false, error: "SMTP is not configured" };
  }

  const secure = port === 465;

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
      ...(secure ? {} : { requireTLS: true }),
    });

    const info = await transport.sendMail({
      from: fromName ? `"${fromName}" <${from}>` : from,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });

    return { ok: true, provider: "smtp", ref: info.messageId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SMTP request failed",
    };
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<SendEmailResult> {
  const twilio = getTwilioEmailConfig();
  const smtp = getSmtpConfig();

  if (twilio.isConfigured) {
    const twilioResult = await sendTwilioEmail(to, subject, text, html);
    if (twilioResult.ok) return twilioResult;

    if (smtp.isConfigured) {
      console.warn(
        "[sendEmail] Twilio failed, falling back to SMTP:",
        twilioResult.error
      );
      const smtpResult = await sendSmtpEmail(to, subject, text, html);
      if (smtpResult.ok) return smtpResult;
      return {
        ok: false,
        error: `Twilio: ${twilioResult.error}; SMTP: ${smtpResult.error}`,
      };
    }

    return twilioResult;
  }

  if (smtp.isConfigured) {
    return sendSmtpEmail(to, subject, text, html);
  }

  return { ok: false, error: "No email provider configured (Twilio or SMTP)" };
}
