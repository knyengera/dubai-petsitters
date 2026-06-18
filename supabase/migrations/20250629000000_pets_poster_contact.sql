-- Poster contact details for user-submitted adoption listings so adopters can
-- reach out directly (email/phone) from the public listing detail view.

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS poster_name TEXT,
  ADD COLUMN IF NOT EXISTS poster_email TEXT,
  ADD COLUMN IF NOT EXISTS poster_phone TEXT;

-- Seed the email from the existing creator reference where missing.
UPDATE public.pets
SET poster_email = COALESCE(NULLIF(TRIM(poster_email), ''), NULLIF(TRIM(created_by), ''))
WHERE poster_email IS NULL OR TRIM(poster_email) = '';
