-- Recurring monthly billing for partner advertising plans (Stripe Billing).
-- Adds Stripe Product/Price references to advertising_plans and a table that
-- tracks the live subscription state synced from Stripe webhooks.

ALTER TABLE advertising_plans
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'month';

CREATE TABLE IF NOT EXISTS partner_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES partner_inquiries(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES advertising_plans(id) ON DELETE SET NULL,
  user_id UUID,
  plan_name TEXT,
  payer_name TEXT,
  payer_email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('incomplete', 'active', 'past_due', 'canceled')),
  currency TEXT NOT NULL DEFAULT 'USD',
  amount NUMERIC NOT NULL DEFAULT 0,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_email
  ON partner_subscriptions (payer_email);
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_customer
  ON partner_subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_status
  ON partner_subscriptions (status);

ALTER TABLE partner_subscriptions ENABLE ROW LEVEL SECURITY;

-- Authenticated partners can read their own subscriptions (matched by email).
DROP POLICY IF EXISTS partner_subscriptions_select_own ON partner_subscriptions;
CREATE POLICY partner_subscriptions_select_own ON partner_subscriptions
  FOR SELECT
  USING (
    public.is_admin()
    OR lower(payer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Admins manage everything; service role (webhook) bypasses RLS entirely.
DROP POLICY IF EXISTS partner_subscriptions_admin_write ON partner_subscriptions;
CREATE POLICY partner_subscriptions_admin_write ON partner_subscriptions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
