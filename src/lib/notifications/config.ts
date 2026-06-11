export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messageServiceSid = process.env.TWILIO_MESSAGE_SERVICE_SID;
  const emailFrom = process.env.TWILIO_EMAIL_FROM;
  const emailFromName = process.env.TWILIO_EMAIL_FROM_NAME || "Saudi Petsitters";

  return {
    accountSid,
    authToken,
    messageServiceSid,
    emailFrom,
    emailFromName,
    isSmsConfigured: Boolean(accountSid && authToken && messageServiceSid),
    isEmailConfigured: Boolean(accountSid && authToken && emailFrom),
  };
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  const fromName = process.env.SMTP_FROM_NAME || "Saudi Petsitters";

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
