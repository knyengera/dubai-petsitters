# Supabase Auth Email Templates

Branded HTML templates for **Supabase Dashboard → Authentication → Email Templates**.

## Important: Auth hooks override Dashboard templates

When the **Send Email** auth hook is enabled (see [SUPABASE_AUTH_SETUP.md](../SUPABASE_AUTH_SETUP.md)), Supabase sends mail through your Next.js app via Twilio instead of these Dashboard templates. Use these files for local dev, staging without hooks, or as a fallback.

## Magic Link slot: URL vs OTP

Supabase has only **one** `magic_link` template slot. Choose **one** of:

| File | Use when |
|------|----------|
| `magic_link.html` | Passwordless sign-in sends a **link** (`{{ .ConfirmationURL }}`) |
| `magic_link_otp.html` | Passwordless sign-in sends a **6-digit code** (`{{ .Token }}`) |

## Template mapping

| File | Dashboard slot | Recommended subject |
|------|----------------|---------------------|
| `confirmation.html` | Confirm signup | `Confirm your email — Saudi Petsitters` |
| `email_change.html` | Change email address | `Confirm your new email address` |
| `recovery.html` | Reset password | `Reset your password` |
| `magic_link.html` | Magic Link | `Your sign-in link` |
| `magic_link_otp.html` | Magic Link (OTP variant) | `Your verification code` |
| `invite.html` | Invite user | `You've been invited to Saudi Petsitters` |
| `reauthentication.html` | Reauthentication | `{{ .Token }} is your verification code` |

## How to paste

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Email Templates**
2. Select the template type from the table above
3. Copy the full contents of the matching `.html` file and paste into the **Message body**
4. Set the **Subject** from the table above
5. Save

## Brand assets

- Header logo: `https://www.saudipetsitters.com/logo-white.png`
- Colors match `src/lib/notifications/email-layout.ts`
