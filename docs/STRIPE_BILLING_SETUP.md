# Stripe Billing Setup (Partner Advertising Subscriptions)

Partner advertising plans on `/become-partner` are billed as **recurring monthly Stripe subscriptions**. After a partner fills in their business details and picks a plan, they're redirected to Stripe Checkout in `subscription` mode. Stripe charges the card every month until the subscription is canceled, and webhooks keep the app in sync.

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Server only | Creates products/prices, customers, subscription Checkout sessions, and Customer Portal sessions |
| `STRIPE_WEBHOOK_SECRET` | Server only | Verifies the payments webhook (shared with one-time payment events) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Writes subscription state from the webhook |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL for Checkout success/cancel and portal return URLs |

## Webhook events

The subscription logic runs on the existing payments endpoint:

```
${NEXT_PUBLIC_APP_URL}/api/payments/stripe/webhook
```

Add these events to that endpoint (in addition to the one-time payment events `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`, `refund.created`, `refund.updated`):

- `checkout.session.completed` (already subscribed; subscription-mode sessions are routed automatically)
- `invoice.paid` — recurring monthly success; refreshes the next billing date
- `invoice.payment_failed` — marks the subscription `past_due` (Stripe handles retries/dunning)
- `customer.subscription.updated` — syncs status, cancel-at-period-end, period end
- `customer.subscription.deleted` — marks the subscription `canceled`

### Local development

```bash
stripe listen \
  --forward-to localhost:3000/api/payments/stripe/webhook \
  --events checkout.session.completed,invoice.paid,invoice.payment_failed,customer.subscription.updated,customer.subscription.deleted,payment_intent.succeeded,charge.refunded,refund.created,refund.updated
```

Put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

## Customer Portal

Self-service cancellation and payment-method updates use the [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal). Configure it once in the Dashboard (Settings -> Billing -> Customer portal):

- Allow customers to **cancel subscriptions** and **update payment methods**.
- Optionally allow viewing invoices.

Partners reach it from the success page or `/partners/manage` (must be signed in with the email used to subscribe). Admins can also cancel from Admin -> Subscriptions.

## How it works

1. `/become-partner` creates a `PartnerInquiry`, then `createPartnerSubscriptionCheckout` ([subscription-actions.ts](../src/lib/partners/subscription-actions.ts)) ensures a Stripe Product/Price for the plan ([stripe-plan-sync.ts](../src/lib/partners/stripe-plan-sync.ts)), finds/creates a Stripe Customer, opens a `mode: "subscription"` Checkout, and inserts a `partner_subscriptions` row (`status='incomplete'`).
2. On payment, Stripe fires `checkout.session.completed` + `invoice.paid`. The webhook ([subscription-webhook.ts](../src/lib/partners/subscription-webhook.ts)) links the subscription id and marks the row `active`, setting the inquiry `status='subscribed'`.
3. Each month Stripe charges the card and sends `invoice.paid`, refreshing `current_period_end`. Failures send `invoice.payment_failed` (`past_due`).
4. Cancellation (portal or admin) fires `customer.subscription.deleted`, marking the row `canceled` and the inquiry `cancelled`.

Public partner listings remain admin-approved via `vet_clinics.is_approved`; subscription state is surfaced on the inquiry and in Admin -> Subscriptions so admins know which listings are paid-for.

## Plan pricing

Plan amounts/currency live in `advertising_plans` ([migration](../supabase/migrations/20250616000000_advertising_plans.sql)). The Stripe Product/Price ids are created lazily and stored in `stripe_product_id` / `stripe_price_id` ([migration](../supabase/migrations/20250623000000_partner_subscriptions.sql)). Because Stripe Prices are immutable, changing a plan's amount creates a new Price and archives the old one; existing subscribers stay on their original price until migrated.

## Apply migrations

```bash
npm run db:migrate
```

This applies [20250623000000_partner_subscriptions.sql](../supabase/migrations/20250623000000_partner_subscriptions.sql), which adds the Stripe columns to `advertising_plans` and creates `partner_subscriptions` with RLS.
