-- Columns used by catalog seed data and existing UI forms/cards.

ALTER TABLE partner_deals
  ADD COLUMN IF NOT EXISTS partner_type TEXT,
  ADD COLUMN IF NOT EXISTS discount_label TEXT,
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE lost_pets
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS age TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_phone TEXT,
  ADD COLUMN IF NOT EXISTS owner_email TEXT,
  ADD COLUMN IF NOT EXISTS reward_offered NUMERIC;

UPDATE lost_pets
SET
  photo_url = COALESCE(photo_url, image_url),
  owner_name = COALESCE(owner_name, contact_name),
  owner_phone = COALESCE(owner_phone, contact_phone),
  owner_email = COALESCE(owner_email, contact_email)
WHERE
  photo_url IS NULL
  OR owner_name IS NULL
  OR owner_phone IS NULL
  OR owner_email IS NULL;

ALTER TABLE vet_subscriptions
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS promo_title TEXT,
  ADD COLUMN IF NOT EXISTS promo_description TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC,
  ADD COLUMN IF NOT EXISTS gateway TEXT,
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

UPDATE vet_subscriptions vs
SET
  clinic_name = COALESCE(vs.clinic_name, vc.name),
  city = COALESCE(vs.city, vc.city),
  address = COALESCE(vs.address, vc.address),
  contact_email = COALESCE(vs.contact_email, vc.email),
  contact_phone = COALESCE(vs.contact_phone, vc.phone),
  specialties = COALESCE(vs.specialties, vc.specialties, '{}')
FROM vet_clinics vc
WHERE vs.clinic_id = vc.id;

ALTER TABLE forum_comments
  ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upvoted_by TEXT[] DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vet_subscriptions'
      AND policyname = 'vet_subscriptions_active_public_read'
  ) THEN
    CREATE POLICY vet_subscriptions_active_public_read ON vet_subscriptions
      FOR SELECT
      USING (status = 'active' OR public.is_admin());
  END IF;
END $$;
