-- Stripe Identity verification for pet hosts
-- Adds verification status to profiles and tracks per-attempt sessions used
-- by the cross-device (QR -> phone camera) onboarding flow.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS id_verification_status TEXT
    CHECK (id_verification_status IN ('pending', 'processing', 'requires_input', 'verified', 'canceled')),
  ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_verification_session_id TEXT,
  ADD COLUMN IF NOT EXISTS id_verification_error TEXT;

-- One row per Stripe Identity attempt. The QR code carries an opaque token whose
-- SHA-256 hash is stored here; the phone exchanges it for the Stripe session URL.
CREATE TABLE IF NOT EXISTS identity_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'requires_input', 'verified', 'canceled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_verification_sessions_token_hash_idx
  ON identity_verification_sessions (token_hash);
CREATE INDEX IF NOT EXISTS identity_verification_sessions_user_id_idx
  ON identity_verification_sessions (user_id);

ALTER TABLE identity_verification_sessions ENABLE ROW LEVEL SECURITY;

-- Users may read their own attempts. Inserts and updates happen through the
-- service role (server actions + Stripe webhook), which bypasses RLS.
DROP POLICY IF EXISTS identity_sessions_select_own ON identity_verification_sessions;
CREATE POLICY identity_sessions_select_own ON identity_verification_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Grandfather existing hosts: anyone who already has a live host listing is
-- treated as verified so the new completeness check doesn't lock them out.
UPDATE profiles p
SET id_verification_status = 'verified',
    id_verified_at = now()
WHERE p.id_verification_status IS NULL
  AND (
    EXISTS (SELECT 1 FROM pet_hosts h WHERE h.user_id = p.id)
    OR EXISTS (SELECT 1 FROM pet_hosts h WHERE h.created_by = p.email)
  );

-- Realtime: the desktop wizard subscribes to its own profile row to react when
-- the phone completes verification. Guarded because ALTER PUBLICATION ... ADD
-- TABLE errors if the table is already a member (no IF NOT EXISTS form exists).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
