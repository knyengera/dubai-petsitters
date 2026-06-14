-- Partner advertising plans (admin-managed pricing tiers)

CREATE TABLE IF NOT EXISTS advertising_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  period_label TEXT NOT NULL DEFAULT '/month',
  features TEXT[] NOT NULL DEFAULT '{}',
  badge TEXT,
  highlight TEXT NOT NULL DEFAULT 'default'
    CHECK (highlight IN ('default', 'featured', 'premium')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertising_plans_active_sort
  ON advertising_plans (is_active, sort_order ASC);

INSERT INTO advertising_plans (name, amount, currency, period_label, features, badge, highlight, sort_order, is_active)
SELECT * FROM (VALUES
  (
    'Starter'::text,
    299::numeric,
    'USD'::text,
    '/month'::text,
    ARRAY['Directory listing', 'Business profile page', 'Contact button', '500 impressions/month']::text[],
    NULL::text,
    'default'::text,
    1::integer,
    true::boolean
  ),
  (
    'Professional',
    799,
    'USD',
    '/month',
    ARRAY['Everything in Starter', 'Featured placement', 'Banner ad on relevant pages', '5,000 impressions/month', 'Monthly analytics report'],
    'Most Popular',
    'featured',
    2,
    true
  ),
  (
    'Premium',
    1999,
    'USD',
    '/month',
    ARRAY['Everything in Professional', 'Homepage spotlight', 'Priority search ranking', 'Unlimited impressions', 'Dedicated account manager', 'Custom landing page'],
    NULL,
    'premium',
    3,
    true
  )
) AS seed(name, amount, currency, period_label, features, badge, highlight, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM advertising_plans LIMIT 1);

ALTER TABLE advertising_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY advertising_plans_public_read ON advertising_plans
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY advertising_plans_admin_write ON advertising_plans
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
