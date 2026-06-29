-- Partner advertising billing toggle (global on/off switch)

CREATE TABLE IF NOT EXISTS partner_advertising_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Singleton: only one settings row
CREATE UNIQUE INDEX IF NOT EXISTS partner_advertising_settings_singleton
  ON partner_advertising_settings ((true));

INSERT INTO partner_advertising_settings (billing_enabled)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM partner_advertising_settings);

ALTER TABLE partner_advertising_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY partner_advertising_settings_public_read ON partner_advertising_settings
  FOR SELECT USING (true);

CREATE POLICY partner_advertising_settings_admin_write ON partner_advertising_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPC: read partner advertising settings (public)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_partner_advertising_settings()
RETURNS partner_advertising_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM partner_advertising_settings
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_advertising_settings() TO anon, authenticated;
