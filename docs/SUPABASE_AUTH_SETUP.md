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

## Dashboard email templates (branded HTML)

Branded Supabase auth email HTML lives in [`docs/supabase-email-templates/`](supabase-email-templates/). Copy each file into **Authentication → Email Templates** in the [Supabase Dashboard](https://supabase.com/dashboard).

| File | Dashboard slot | Recommended subject |
|------|----------------|---------------------|
| `confirmation.html` | Confirm signup | `Confirm your email — Dubai Petsitters` |
| `email_change.html` | Change email address | `Confirm your new email address` |
| `recovery.html` | Reset password | `Reset your password` |
| `magic_link.html` | Magic Link | `Your sign-in link` |
| `magic_link_otp.html` | Magic Link (OTP variant) | `Your verification code` |
| `invite.html` | Invite user | `You've been invited to Dubai Petsitters` |
| `reauthentication.html` | Reauthentication | `{{ .Token }} is your verification code` |

**Paste steps:** open the template type in the Dashboard → paste the full HTML from the matching file into **Message body** → set **Subject** from the table → Save.

**Magic Link slot:** Supabase has only one Magic Link template. Use `magic_link.html` (sign-in URL) **or** `magic_link_otp.html` (6-digit code), not both.

**Auth hook override:** When the Send Email hook is enabled (below), Supabase does **not** use these Dashboard templates in production — mail is sent via Twilio (with SMTP fallback) from your Next.js app instead. Use Dashboard templates for local dev, staging without hooks, or as a fallback.

## Custom Auth Hooks (Twilio Email + SMS)

Branded auth messages are sent via your Next.js app using Twilio (SMTP fallback on failure) instead of default Supabase templates.

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
TWILIO_EMAIL_FROM_NAME=Dubai Petsitters
AUTH_HOOK_SECRET=
```

### SMTP fallback (when Twilio Email fails)

Email is sent via Twilio first. If Twilio fails or is unconfigured, the app falls back to SMTP (`src/lib/notifications/send-email.ts`). Set these in `.env.local`, Vercel Production, and Supabase Edge Function secrets if you use `process-notifications`:

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_FROM_NAME=Dubai Petsitters
```

Use port `465` for SMTPS or `587` for STARTTLS.

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

Phone numbers must be in E.164 format (e.g. `+971501234567`).

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

Alternatively deploy `supabase/functions/process-notifications` and schedule it in Supabase. Set `SMTP_*` secrets there too if you rely on SMTP fallback.

## Troubleshooting auth hooks

| Supabase error | Likely cause | Fix |
|----------------|--------------|-----|
| `Hook requires authorization token` | Hook secret mismatch or old Bearer-only verification | Match `AUTH_HOOK_SECRET` in Vercel to Dashboard → Hooks; deploy Standard Webhooks verification |
| `over_email_send_rate_limit` | Too many signup/recovery attempts | Wait 30–60 min; raise **Authentication → Rate Limits → Emails sent** |
| `Unexpected status code returned from hook: 500` | Your `/api/auth/hooks/send-email` handler failed | Check Vercel function logs for `[auth/hooks/send-email]` or `[sendEmail] Twilio failed, falling back to SMTP` |
| Hook 500 after Twilio error in logs | Twilio failed and SMTP fallback also failed | Verify `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` in Vercel; test SMTP credentials independently |

Common causes of hook **500**:

1. **Twilio env vars missing in Vercel Production** — set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_EMAIL_FROM` (not just in `.env.local`)
2. **Sender domain not verified** — Twilio Console → Email → Domain Authentication; `TWILIO_EMAIL_FROM` must use that domain
3. **Twilio Email not enabled** on the account — enable Email in Twilio Console before using `comms.twilio.com/v1/Emails`
4. **SMTP fallback misconfigured** — if Twilio fails, set `SMTP_*` env vars; logs show `Twilio failed, falling back to SMTP` when fallback is attempted

After changing Vercel env vars, redeploy the app.

## Local Development

`supabase/config.toml` includes auth settings for the local Supabase stack. Run `supabase start` and apply migrations with `supabase db reset` or `supabase migration up`.

OAuth, SMS, and auth hooks still require provider credentials in the dashboard (or local env overrides where supported).
