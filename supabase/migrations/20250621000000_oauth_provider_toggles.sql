-- OAuth provider toggles (Google + Apple) for the login page

ALTER TABLE platform_auth_settings
  ADD COLUMN IF NOT EXISTS google_oauth_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS apple_oauth_enabled BOOLEAN NOT NULL DEFAULT true;

-- Recreate the RPC so its return type picks up the new columns.
CREATE OR REPLACE FUNCTION public.get_auth_verification_settings()
RETURNS platform_auth_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM platform_auth_settings
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_verification_settings() TO anon, authenticated;
