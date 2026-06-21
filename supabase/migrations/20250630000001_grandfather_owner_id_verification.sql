-- Identity verification is now required for ALL account types (pet owners too),
-- not just hosts. Existing users who already completed onboarding before this
-- change have no Stripe Identity record, so grandfather them in as verified to
-- avoid forcing them back through verification on their next visit.
--
-- Hosts with a live listing were already grandfathered in
-- 20250622000000_identity_verification.sql; this covers everyone else who has
-- a completed profile.

UPDATE profiles
SET id_verification_status = 'verified',
    id_verified_at = COALESCE(id_verified_at, now())
WHERE id_verification_status IS NULL
  AND profile_completed_at IS NOT NULL;
