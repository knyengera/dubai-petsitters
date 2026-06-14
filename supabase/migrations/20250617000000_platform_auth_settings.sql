-- Platform auth verification toggles (email confirmation + phone SMS OTP)

CREATE TABLE IF NOT EXISTS platform_auth_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_verification_enabled BOOLEAN NOT NULL DEFAULT true,
  phone_verification_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Singleton: only one settings row
CREATE UNIQUE INDEX IF NOT EXISTS platform_auth_settings_singleton
  ON platform_auth_settings ((true));

INSERT INTO platform_auth_settings (email_verification_enabled, phone_verification_enabled)
SELECT true, true
WHERE NOT EXISTS (SELECT 1 FROM platform_auth_settings);

ALTER TABLE platform_auth_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_auth_settings_public_read ON platform_auth_settings
  FOR SELECT USING (true);

CREATE POLICY platform_auth_settings_admin_write ON platform_auth_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPC: read auth verification settings (public)
-- ---------------------------------------------------------------------------

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
