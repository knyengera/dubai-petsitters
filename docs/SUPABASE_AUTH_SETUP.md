# Supabase Auth Setup (Social Login, Email & Phone Verification)

Configure these in the [Supabase Dashboard](https://supabase.com/dashboard) before testing OAuth and SMS in production.

## Site URL & Redirect URLs

**Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` (dev) or your production URL |
| Redirect URLs | `http://localhost:3000/auth/callback`, `https://your-domain.com/auth/callback`, `https://your-domain.com/reset-password` |

## Email Confirmation

**Authentication → Providers → Email**

- Enable **Confirm email**
- Users must verify email before full access (enforced by app middleware)

## Custom Auth Hooks (Twilio Email + SMS)

Branded auth messages are sent via your Next.js app using Twilio instead of default Supabase templates.

**Authentication → Hooks**

| Hook | URI |
|------|-----|
| Send Email | `https://your-domain.com/api/auth/hooks/send-email` |
| Send SMS | `https://your-domain.com/api/auth/hooks/send-sms` |

Set the hook secret to match `AUTH_HOOK_SECRET` in your environment (format: `v1,whsec_<base64>`). Supabase signs hook requests with Standard Webhooks headers (`webhook-id`, `webhook-timestamp`, `webhook-signature`); the app verifies those signatures in `src/lib/notifications/auth-hook.ts`.

Local dev: `supabase/config.toml` points hooks to `http://host.docker.internal:3000/api/auth/hooks/...` when running `supabase start` alongside `next dev`.

### Required env vars

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGE_SERVICE_SID=
TWILIO_EMAIL_FROM=noreply@yourdomain.com
TWILIO_EMAIL_FROM_NAME=Saudi Petsitters
AUTH_HOOK_SECRET=
```

## Twilio Email (transactional + auth)

1. [Twilio Console](https://console.twilio.com/) → **Email** → enable Twilio Email
2. **Domain Authentication** — add SPF/DKIM DNS records for your sending domain
3. Set `TWILIO_EMAIL_FROM` to an address on the verified domain

API: `POST https://comms.twilio.com/v1/Emails` (Basic Auth with Account SID + Auth Token)

## Twilio SMS (Phone OTP + transactional)

**Authentication → Providers → Phone**

- Enable phone provider
- Select **Twilio** as SMS provider (or use Auth Hook for custom OTP SMS)
- Add:
  - Twilio Account SID
  - Twilio Auth Token
  - Twilio Message Service SID (or Verify Service)

Phone numbers must be in E.164 format (e.g. `+966501234567`).

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Supabase → Authentication → Providers → Google** — enable and paste Client ID + Client Secret

## Apple OAuth

1. [Apple Developer](https://developer.apple.com/) → Certificates, Identifiers & Profiles
2. Create a Services ID and Sign in with Apple key
3. **Supabase → Authentication → Providers → Apple** — enable and configure Services ID, Team ID, Key ID, and private key

## Password reset

- Users request reset at `/forgot-password`
- Reset link lands on `/reset-password` (add to Redirect URLs)
- Recovery emails use the `send_email` auth hook with `email_action_type: recovery`

## Notification dispatcher (transactional)

Poll the outbox queue via cron:

```
GET /api/cron/notifications
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` in env. On Vercel, add a cron job hitting this route every 1–2 minutes.

Alternatively deploy `supabase/functions/process-notifications` and schedule it in Supabase.

## Local Development

`supabase/config.toml` includes auth settings for the local Supabase stack. Run `supabase start` and apply migrations with `supabase db reset` or `supabase migration up`.

OAuth, SMS, and auth hooks still require provider credentials in the dashboard (or local env overrides where supported).
