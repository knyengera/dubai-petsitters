-- Account deactivation and soft delete
-- Deactivation is a reversible pause: the profile is flagged and the user's host
-- listings are hidden; logging back in clears the flag and restores listings.
-- Soft delete marks the profile as deleted and blocks future logins (enforced in
-- middleware). We intentionally do NOT hard-delete auth.users, so the ON DELETE
-- CASCADE on profiles.id is never triggered and records are retained.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at);
