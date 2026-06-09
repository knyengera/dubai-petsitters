# Supabase Auth Setup (Social Login, Email & Phone Verification)

Configure these in the [Supabase Dashboard](https://supabase.com/dashboard) before testing OAuth and SMS in production.

## Site URL & Redirect URLs

**Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` (dev) or your production URL |
| Redirect URLs | `http://localhost:3000/auth/callback`, `https://your-domain.com/auth/callback` |

## Email Confirmation

**Authentication → Providers → Email**

- Enable **Confirm email**
- Users must verify email before full access (enforced by app middleware)

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Supabase → Authentication → Providers → Google** — enable and paste Client ID + Client Secret

## Apple OAuth

1. [Apple Developer](https://developer.apple.com/) → Certificates, Identifiers & Profiles
2. Create a Services ID and Sign in with Apple key
3. **Supabase → Authentication → Providers → Apple** — enable and configure Services ID, Team ID, Key ID, and private key

## Twilio (Phone OTP)

**Authentication → Providers → Phone**

- Enable phone provider
- Select **Twilio** as SMS provider
- Add:
  - Twilio Account SID
  - Twilio Auth Token
  - Twilio Message Service SID (or Verify Service)

Phone numbers must be in E.164 format (e.g. `+966501234567`).

## Local Development

`supabase/config.toml` includes auth settings for the local Supabase stack. Run `supabase start` and apply migrations with `supabase db reset` or `supabase migration up`.

OAuth and SMS still require provider credentials in the dashboard (or local env overrides where supported).
