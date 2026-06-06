-- Partner inquiry submissions from /partners and advertising modals

CREATE TABLE IF NOT EXISTS partner_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  business_type TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  website TEXT,
  plan TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Public lead capture: anon and authenticated users may submit inquiries
CREATE POLICY partner_inquiries_public_insert ON partner_inquiries
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- Admin-only read/update/delete
CREATE POLICY partner_inquiries_admin_select ON partner_inquiries
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY partner_inquiries_admin_update ON partner_inquiries
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY partner_inquiries_admin_delete ON partner_inquiries
  FOR DELETE
  USING (public.is_admin());

-- Allow public insert for vet subscriptions (vet-advertise form)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vet_subscriptions'
      AND policyname = 'vet_subscriptions_public_insert'
  ) THEN
    CREATE POLICY vet_subscriptions_public_insert ON vet_subscriptions
      FOR INSERT
      WITH CHECK (auth.role() IN ('anon', 'authenticated'));
  END IF;
END $$;

-- Allow public insert for payments (vet-advertise / partner payment flows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'payments_public_insert'
  ) THEN
    CREATE POLICY payments_public_insert ON payments
      FOR INSERT
      WITH CHECK (auth.role() IN ('anon', 'authenticated'));
  END IF;
END $$;

-- Admin write access for vet_subscriptions and payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vet_subscriptions'
      AND policyname = 'vet_subscriptions_admin_write'
  ) THEN
    CREATE POLICY vet_subscriptions_admin_write ON vet_subscriptions
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'payments_admin_write'
  ) THEN
    CREATE POLICY payments_admin_write ON payments
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
