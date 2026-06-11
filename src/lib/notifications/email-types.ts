export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider?: "twilio" | "smtp";
  providerRef?: string;
  error?: string;
}
