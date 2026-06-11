import nodemailer from "nodemailer";

import { getSmtpConfig } from "@/lib/notifications/config";
import type { SendEmailInput, SendEmailResult } from "@/lib/notifications/email-types";

export async function sendSmtpEmail(input: SendEmailInput): Promise<SendEmailResult> {
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
      to: input.toName ? `"${input.toName}" <${input.to}>` : input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });

    return {
      ok: true,
      provider: "smtp",
      providerRef: info.messageId,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SMTP request failed",
    };
  }
}
