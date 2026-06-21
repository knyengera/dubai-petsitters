# Stripe Identity Setup (Host ID Verification)

Pet hosts verify their passport or national ID during onboarding using Stripe Identity. The desktop wizard shows a QR code; the host scans it with their phone, which opens Stripe's camera-based document + selfie flow. Results sync back to the wizard automatically through a Stripe webhook and Supabase Realtime.

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Server only | Creates and retrieves Identity verification sessions (reused from payments) |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Server only | Signing secret for the Identity webhook endpoint. Falls back to `STRIPE_WEBHOOK_SECRET` if unset |
| `STRIPE_IDENTITY_RESTRICTED_KEY` | Server only | Optional. Restricted key used to read the verified `sex` field so the KYC step can auto-fill gender. Falls back to `STRIPE_SECRET_KEY` if unset |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Records verification sessions and writes results from the webhook |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL embedded in the QR code and Stripe return URL |

No publishable key is needed — the flow redirects to Stripe's hosted page rather than using a Stripe.js modal.

## Auto-filling KYC details (DOB, gender, ID number)

When verification succeeds, Stripe's extracted document data pre-fills the Profile & KYC step. Stripe omits sensitive PII from API responses unless it is explicitly expanded, so we retrieve the verified session with `expand` for `verified_outputs.dob`, `verified_outputs.id_number`, and the document's `sex`/`number` ([src/lib/identity/stripe-identity.ts](../src/lib/identity/stripe-identity.ts)).

- `date of birth` and `ID number` are returned with the standard `STRIPE_SECRET_KEY` once expanded — these always auto-fill.
- `sex` (gender) is extra-sensitive and Stripe only returns it when the request is authenticated with a restricted API key. To enable gender auto-fill:
  1. Stripe Dashboard -> Developers -> API keys -> Create restricted key.
  2. Set these Identity permissions to Read:
     - "Identity Verification Sessions and Reports"
     - "Access recent sensitive verification results"
  3. Set the key as `STRIPE_IDENTITY_RESTRICTED_KEY`.
- Without the restricted key, gender simply stays a manual selection on the KYC step; everything else still works.

### No IP allowlist required

This integration reads the verified PII immediately when the session becomes `verified` (the webhook and the desktop reconcile during onboarding), then stores it on the profile and never re-reads it from Stripe. That always falls inside Stripe's 48-hour window for the "Access recent sensitive verification results" permission, so a restricted key with that permission works without any IP restriction.

IP allowlisting is only needed for the separate "Access all sensitive verification results" permission (reading PII older than 48 hours), which this app does not use. That matters on Vercel, whose serverless functions don't have stable outbound IPs — you can skip IP restrictions entirely here. (If you later add an over-48h read path, you'd need a static egress IP via Vercel Secure Compute or a proxy like QuotaGuard/Fixie.)

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
