# Stripe Identity Setup (Host ID Verification)

Pet hosts verify their passport or national ID during onboarding using Stripe Identity. The desktop wizard shows a QR code; the host scans it with their phone, which opens Stripe's camera-based document + selfie flow. Results sync back to the wizard automatically through a Stripe webhook and Supabase Realtime.

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Server only | Creates and retrieves Identity verification sessions (reused from payments) |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Server only | Signing secret for the Identity webhook endpoint. Falls back to `STRIPE_WEBHOOK_SECRET` if unset |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Records verification sessions and writes results from the webhook |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL embedded in the QR code and Stripe return URL |

No publishable key is needed — the flow redirects to Stripe's hosted page rather than using a Stripe.js modal.

## Dashboard setup

1. Activate Identity: Stripe Dashboard -> Identity -> get started. Confirm your account's business location supports Identity (document checks cover SA-issued IDs).
2. Create a webhook endpoint pointing at `${NEXT_PUBLIC_APP_URL}/api/stripe/identity/webhook` and subscribe to these events:
   - `identity.verification_session.processing`
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.canceled`
3. Copy the endpoint's signing secret into `STRIPE_IDENTITY_WEBHOOK_SECRET`.
4. Test in Stripe test mode first — in test mode the checks complete without real processing.

## How it works

- The wizard's host-only "Verify ID" step calls `startIdentityVerification()` ([src/lib/identity/actions.ts](../src/lib/identity/actions.ts)), which creates a Stripe session and stores a single-use token in `identity_verification_sessions`.
- The QR encodes `${NEXT_PUBLIC_APP_URL}/verify/id?s=<token>`. The phone hits [src/app/(main)/verify/id/page.tsx](../src/app/\(main\)/verify/id/page.tsx), which exchanges the token for the Stripe session URL and redirects.
- The webhook ([src/app/api/stripe/identity/webhook/route.ts](../src/app/api/stripe/identity/webhook/route.ts)) maps the Stripe status onto `profiles.id_verification_status` and sets `id_verified_at` when verified.
- The desktop subscribes to its own `profiles` row via Supabase Realtime (with polling fallback) and advances automatically once the status becomes `verified`.

## Apply migrations

```bash
npm run db:migrate
```

This applies [supabase/migrations/20250622000000_identity_verification.sql](../supabase/migrations/20250622000000_identity_verification.sql), which adds the verification columns to `profiles`, creates `identity_verification_sessions`, grandfathers existing hosts as verified, and adds `profiles` to the `supabase_realtime` publication.
