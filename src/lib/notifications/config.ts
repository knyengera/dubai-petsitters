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
