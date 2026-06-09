import { getAppBaseUrl } from "@/lib/notifications/config";
import { renderNotification } from "@/lib/notifications/templates";
import { sendTwilioEmail } from "@/lib/notifications/twilio-email";
import { sendTwilioSms } from "@/lib/notifications/twilio-sms";

export function verifyAuthHookSecret(request: Request): boolean {
  const secret = process.env.AUTH_HOOK_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}` || auth === secret;
}

interface SendEmailHookPayload {
  user: { email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

export async function handleSendEmailHook(
  payload: SendEmailHookPayload
): Promise<{ ok: boolean; error?: string }> {
  const email = payload.user?.email;
  if (!email) return { ok: false, error: "Missing user email" };

  const { token_hash, redirect_to, email_action_type, site_url } =
    payload.email_data;

  const base = getAppBaseUrl();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  let templateKey = "auth.signup";
  let url = redirect_to || `${base}/auth/callback`;

  if (email_action_type === "recovery") {
    templateKey = "auth.recovery";
    url = `${base}/reset-password?token_hash=${encodeURIComponent(token_hash)}&type=recovery`;
  } else if (email_action_type === "magiclink") {
    templateKey = "auth.magic_link";
    url =
      supabaseUrl && token_hash
        ? `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token_hash)}&type=magiclink&redirect_to=${encodeURIComponent(redirect_to || base)}`
        : redirect_to || base;
  } else if (email_action_type === "email_change") {
    templateKey = "auth.email_change";
    url =
      supabaseUrl && token_hash
        ? `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token_hash)}&type=email_change&redirect_to=${encodeURIComponent(redirect_to || base)}`
        : redirect_to || base;
  } else if (
    email_action_type === "signup" ||
    email_action_type === "invite" ||
    email_action_type === "confirmation"
  ) {
    templateKey = "auth.signup";
    url =
      supabaseUrl && token_hash
        ? `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token_hash)}&type=signup&redirect_to=${encodeURIComponent(redirect_to || `${base}/auth/callback`)}`
        : redirect_to || `${base}/auth/callback`;
  }

  const rendered = renderNotification(templateKey, "email", {
    confirmation_url: url,
    recovery_url: url,
    magic_link_url: url,
    site_url,
  });

  const result = await sendTwilioEmail({
    to: email,
    subject: rendered.subject || "Saudi Petsitters",
    text: rendered.text,
    html: rendered.html,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

interface SendSmsHookPayload {
  user: { phone?: string };
  sms: { otp: string };
}

export async function handleSendSmsHook(
  payload: SendSmsHookPayload
): Promise<{ ok: boolean; error?: string }> {
  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) return { ok: false, error: "Missing phone or OTP" };

  const result = await sendTwilioSms({
    to: phone,
    body: `Your Saudi Petsitters verification code is: ${otp}. It expires in 10 minutes.`,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
