import { getSmtpConfig, getTwilioConfig } from "@/lib/notifications/config";
import type { SendEmailInput, SendEmailResult } from "@/lib/notifications/email-types";
import { sendSmtpEmail } from "@/lib/notifications/smtp-email";
import { sendTwilioEmail } from "@/lib/notifications/twilio-email";

export type { SendEmailInput, SendEmailResult } from "@/lib/notifications/email-types";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { isEmailConfigured } = getTwilioConfig();
  const { isConfigured: isSmtpConfigured } = getSmtpConfig();

  if (isEmailConfigured) {
    const twilioResult = await sendTwilioEmail(input);
    if (twilioResult.ok) return twilioResult;

    if (isSmtpConfigured) {
      console.warn(
        "[sendEmail] Twilio failed, falling back to SMTP:",
        twilioResult.error
      );
      const smtpResult = await sendSmtpEmail(input);
      if (smtpResult.ok) return smtpResult;
      return {
        ok: false,
        error: `Twilio: ${twilioResult.error}; SMTP: ${smtpResult.error}`,
      };
    }

    return twilioResult;
  }

  if (isSmtpConfigured) {
    return sendSmtpEmail(input);
  }

  return { ok: false, error: "No email provider configured (Twilio or SMTP)" };
}
