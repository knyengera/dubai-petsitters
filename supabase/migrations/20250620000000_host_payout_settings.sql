-- Host payout destination settings (bank transfer or PayPal).
-- Stored separately from pet_hosts because pet_hosts is publicly readable.

CREATE TABLE IF NOT EXISTS host_payout_settings (
  host_id UUID PRIMARY KEY REFERENCES pet_hosts(id) ON DELETE CASCADE,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank_transfer', 'paypal')),
  bank_account_holder_name TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_iban_or_routing TEXT,
  bank_swift_bic TEXT,
  paypal_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT host_payout_settings_bank_fields CHECK (
    payout_method <> 'bank_transfer'
    OR (
      bank_account_holder_name IS NOT NULL AND trim(bank_account_holder_name) <> ''
      AND bank_name IS NOT NULL AND trim(bank_name) <> ''
      AND bank_account_number IS NOT NULL AND trim(bank_account_number) <> ''
      AND bank_iban_or_routing IS NOT NULL AND trim(bank_iban_or_routing) <> ''
    )
  ),
  CONSTRAINT host_payout_settings_paypal_fields CHECK (
    payout_method <> 'paypal'
    OR (paypal_email IS NOT NULL AND trim(paypal_email) <> '')
  )
);

ALTER TABLE host_payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY host_payout_settings_host_read ON host_payout_settings
  FOR SELECT USING (
    public.is_admin() OR public.monetisation_host_owned_by_user(host_id)
  );

CREATE POLICY host_payout_settings_host_insert ON host_payout_settings
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.monetisation_host_owned_by_user(host_id)
  );

CREATE POLICY host_payout_settings_host_update ON host_payout_settings
  FOR UPDATE USING (
    public.is_admin() OR public.monetisation_host_owned_by_user(host_id)
  )
  WITH CHECK (
    public.is_admin() OR public.monetisation_host_owned_by_user(host_id)
  );
