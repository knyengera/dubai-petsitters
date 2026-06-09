-- Monetisation & escrow: fee settings, escrow ledger, host balances, payout requests
-- All financial mutations go through SECURITY DEFINER RPC functions.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Extend existing tables
-- ---------------------------------------------------------------------------

ALTER TABLE hosting_bookings
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS guest_fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS host_payout_fee_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS release_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS funds_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_id UUID,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS units INTEGER NOT NULL DEFAULT 1 CHECK (units >= 1);

ALTER TABLE hosting_bookings
  DROP CONSTRAINT IF EXISTS hosting_bookings_escrow_status_check;
ALTER TABLE hosting_bookings
  ADD CONSTRAINT hosting_bookings_escrow_status_check
  CHECK (escrow_status IN ('none', 'pending_payment', 'held', 'release_pending', 'released', 'refunded', 'disputed', 'cancelled'));

ALTER TABLE hosting_bookings
  DROP CONSTRAINT IF EXISTS hosting_bookings_release_status_check;
ALTER TABLE hosting_bookings
  ADD CONSTRAINT hosting_bookings_release_status_check
  CHECK (release_status IN ('none', 'blocked', 'eligible', 'released', 'refunded'));

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_payout_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS booking_id UUID;

ALTER TABLE pet_hosts
  ADD COLUMN IF NOT EXISTS trust_level TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS trusted_release_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_booking_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_release_after_hours INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE pet_hosts
  DROP CONSTRAINT IF EXISTS pet_hosts_trust_level_check;
ALTER TABLE pet_hosts
  ADD CONSTRAINT pet_hosts_trust_level_check
  CHECK (trust_level IN ('new', 'standard', 'trusted', 'premium'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_idempotency_key_key'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_booking_id_fkey'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES hosting_bookings(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hosting_bookings_payment_id_fkey'
  ) THEN
    ALTER TABLE hosting_bookings
      ADD CONSTRAINT hosting_bookings_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  guest_service_fee_pct NUMERIC NOT NULL DEFAULT 10
    CHECK (guest_service_fee_pct >= 0 AND guest_service_fee_pct <= 100),
  host_payout_fee_pct NUMERIC NOT NULL DEFAULT 2
    CHECK (host_payout_fee_pct >= 0 AND host_payout_fee_pct <= 100),
  guest_fee_min NUMERIC NOT NULL DEFAULT 0 CHECK (guest_fee_min >= 0),
  guest_fee_max NUMERIC CHECK (guest_fee_max IS NULL OR guest_fee_max >= 0),
  host_payout_fee_min NUMERIC NOT NULL DEFAULT 0 CHECK (host_payout_fee_min >= 0),
  host_payout_fee_max NUMERIC CHECK (host_payout_fee_max IS NULL OR host_payout_fee_max >= 0),
  currency TEXT NOT NULL DEFAULT 'SAR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS host_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES pet_hosts(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'SAR',
  gross_amount NUMERIC NOT NULL CHECK (gross_amount > 0),
  payout_fee_pct NUMERIC NOT NULL CHECK (payout_fee_pct >= 0 AND payout_fee_pct <= 100),
  payout_fee_amount NUMERIC NOT NULL CHECK (payout_fee_amount >= 0),
  net_amount NUMERIC NOT NULL CHECK (net_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'rejected', 'cancelled')),
  payment_provider TEXT,
  provider_payout_id TEXT,
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  admin_notes TEXT,
  requested_by_email TEXT NOT NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES hosting_bookings(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES pet_hosts(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'SAR',
  base_amount NUMERIC NOT NULL CHECK (base_amount >= 0),
  guest_fee_amount NUMERIC NOT NULL CHECK (guest_fee_amount >= 0),
  gross_amount NUMERIC NOT NULL CHECK (gross_amount >= 0),
  host_earnings NUMERIC NOT NULL CHECK (host_earnings >= 0),
  platform_revenue NUMERIC NOT NULL CHECK (platform_revenue >= 0),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'held', 'release_pending', 'released', 'refunded', 'disputed', 'cancelled')),
  release_eligible_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escrow_amounts_check CHECK (gross_amount = base_amount + guest_fee_amount),
  CONSTRAINT escrow_host_earnings_check CHECK (host_earnings = base_amount),
  CONSTRAINT escrow_platform_revenue_check CHECK (platform_revenue = guest_fee_amount)
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'pay_in', 'escrow_hold', 'platform_guest_fee', 'release_to_host',
    'payout_fee', 'payout_requested', 'payout_paid', 'refund', 'adjustment'
  )),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'SAR',
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  booking_id UUID REFERENCES hosting_bookings(id) ON DELETE SET NULL,
  escrow_id UUID REFERENCES escrow_accounts(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES host_payout_requests(id) ON DELETE SET NULL,
  host_id UUID REFERENCES pet_hosts(id) ON DELETE SET NULL,
  actor_user_id UUID,
  actor_email TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS host_balances (
  host_id UUID PRIMARY KEY REFERENCES pet_hosts(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'SAR',
  available_balance NUMERIC NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance NUMERIC NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  lifetime_earned NUMERIC NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_paid_out NUMERIC NOT NULL DEFAULT 0 CHECK (lifetime_paid_out >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_accounts_host ON escrow_accounts(host_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_status ON escrow_accounts(status);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_booking ON ledger_entries(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_host ON ledger_entries(host_id);
CREATE INDEX IF NOT EXISTS idx_host_payout_requests_host ON host_payout_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_host_payout_requests_status ON host_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_platform_fee_settings_active ON platform_fee_settings(is_active, effective_from DESC);

-- Seed default fee settings
INSERT INTO platform_fee_settings (
  name, guest_service_fee_pct, host_payout_fee_pct, currency, is_active
)
SELECT 'default', 10, 2, 'SAR', true
WHERE NOT EXISTS (SELECT 1 FROM platform_fee_settings WHERE name = 'default' AND is_active = true);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

CREATE OR REPLACE FUNCTION public.monetisation_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.monetisation_host_owned_by_user(p_host_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pet_hosts h
    WHERE h.id = p_host_id
      AND (
        h.created_by = public.monetisation_current_user_email()
        OR h.user_id = public.monetisation_current_user_id()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.monetisation_get_active_fee_settings(p_currency TEXT DEFAULT 'SAR')
RETURNS platform_fee_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM platform_fee_settings
  WHERE is_active = true
    AND currency = p_currency
    AND effective_from <= now()
    AND (effective_until IS NULL OR effective_until > now())
  ORDER BY effective_from DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_round_money(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT round(coalesce(p_amount, 0), 2);
$$;

CREATE OR REPLACE FUNCTION public.monetisation_calc_pct_fee(
  p_base NUMERIC,
  p_pct NUMERIC,
  p_min NUMERIC DEFAULT 0,
  p_max NUMERIC DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_fee NUMERIC;
BEGIN
  v_fee := public.monetisation_round_money(coalesce(p_base, 0) * coalesce(p_pct, 0) / 100);
  IF p_min IS NOT NULL AND v_fee < p_min THEN
    v_fee := p_min;
  END IF;
  IF p_max IS NOT NULL AND v_fee > p_max THEN
    v_fee := p_max;
  END IF;
  RETURN public.monetisation_round_money(v_fee);
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_booking_units(
  p_service_type TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_units INTEGER := 1;
  v_days INTEGER;
BEGIN
  IF p_start_date IS NULL THEN
    RETURN 1;
  END IF;
  IF p_end_date IS NOT NULL AND p_end_date > p_start_date THEN
    v_days := (p_end_date - p_start_date);
    v_units := greatest(1, v_days);
  END IF;
  RETURN v_units;
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_host_unit_price(
  p_host_id UUID,
  p_service_type TEXT,
  p_start_date DATE DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host pet_hosts%ROWTYPE;
  v_override NUMERIC;
  v_price NUMERIC := 0;
BEGIN
  SELECT * INTO v_host FROM pet_hosts WHERE id = p_host_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Host not found';
  END IF;

  IF p_start_date IS NOT NULL THEN
    SELECT price_override INTO v_override
    FROM host_availability
    WHERE host_id = p_host_id AND date = p_start_date
    LIMIT 1;
    IF v_override IS NOT NULL AND v_override > 0 THEN
      RETURN v_override;
    END IF;
  END IF;

  IF p_service_type = 'boarding' OR p_service_type = 'home_sitting' THEN
    v_price := coalesce(v_host.price_per_night, v_host.price_per_day, 0);
  ELSIF p_service_type IN ('daycare', 'dog_walking') THEN
    v_price := coalesce(v_host.price_per_day, v_host.price_per_night, 0);
  ELSE
    v_price := coalesce(v_host.price_per_day, v_host.price_per_night, 0);
  END IF;

  IF v_price <= 0 THEN
    RAISE EXCEPTION 'Host has no price configured for this service';
  END IF;

  RETURN v_price;
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_quote_booking(
  p_host_id UUID,
  p_service_type TEXT,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL,
  p_currency TEXT DEFAULT 'SAR'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings platform_fee_settings;
  v_unit_price NUMERIC;
  v_units INTEGER;
  v_base NUMERIC;
  v_guest_fee NUMERIC;
  v_total NUMERIC;
BEGIN
  v_settings := public.monetisation_get_active_fee_settings(p_currency);
  IF v_settings.id IS NULL THEN
    RAISE EXCEPTION 'No active fee settings found';
  END IF;

  v_unit_price := public.monetisation_host_unit_price(p_host_id, p_service_type, p_start_date);
  v_units := public.monetisation_booking_units(p_service_type, p_start_date, p_end_date);
  v_base := public.monetisation_round_money(v_unit_price * v_units);
  v_guest_fee := public.monetisation_calc_pct_fee(
    v_base,
    v_settings.guest_service_fee_pct,
    v_settings.guest_fee_min,
    v_settings.guest_fee_max
  );
  v_total := public.monetisation_round_money(v_base + v_guest_fee);

  RETURN jsonb_build_object(
    'currency', p_currency,
    'unit_price', v_unit_price,
    'units', v_units,
    'base_amount', v_base,
    'guest_fee_amount', v_guest_fee,
    'total_amount', v_total,
    'host_payout_fee_pct', v_settings.host_payout_fee_pct,
    'guest_service_fee_pct', v_settings.guest_service_fee_pct,
    'fee_settings_id', v_settings.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_append_ledger(
  p_entry_type TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_direction TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_escrow_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_payout_id UUID DEFAULT NULL,
  p_host_id UUID DEFAULT NULL,
  p_actor_user_id UUID DEFAULT NULL,
  p_actor_email TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ledger_entries (
    entry_type, amount, currency, direction,
    booking_id, escrow_id, payment_id, payout_id, host_id,
    actor_user_id, actor_email, description, metadata
  ) VALUES (
    p_entry_type, p_amount, p_currency, p_direction,
    p_booking_id, p_escrow_id, p_payment_id, p_payout_id, p_host_id,
    p_actor_user_id, p_actor_email, p_description, p_metadata
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_ensure_host_balance(p_host_id UUID, p_currency TEXT DEFAULT 'SAR')
RETURNS host_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance host_balances;
BEGIN
  INSERT INTO host_balances (host_id, currency)
  VALUES (p_host_id, p_currency)
  ON CONFLICT (host_id) DO NOTHING;

  SELECT * INTO v_balance FROM host_balances WHERE host_id = p_host_id;
  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_is_supported_provider(p_provider TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(p_provider, '') IN ('paypal', 'payfast', 'salla', 'stripe', 'hyperpay', 'moyasar', 'tap', 'bank_transfer', 'manual');
$$;

-- ---------------------------------------------------------------------------
-- RPC: create booking + escrow + payment intent (server-validated amounts)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_create_hosting_booking(
  p_host_id UUID,
  p_service_type TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_pet_name TEXT,
  p_pet_type TEXT,
  p_owner_name TEXT,
  p_owner_email TEXT,
  p_owner_phone TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_special_instructions TEXT DEFAULT NULL,
  p_payment_provider TEXT DEFAULT 'manual',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := public.monetisation_current_user_id();
  v_user_email TEXT := public.monetisation_current_user_email();
  v_host pet_hosts%ROWTYPE;
  v_quote JSONB;
  v_booking hosting_bookings%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_escrow escrow_accounts%ROWTYPE;
  v_currency TEXT := 'SAR';
BEGIN
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF lower(trim(p_owner_email)) <> lower(trim(v_user_email)) THEN
    RAISE EXCEPTION 'Owner email must match authenticated user';
  END IF;
  IF NOT public.monetisation_is_supported_provider(p_payment_provider) THEN
    RAISE EXCEPTION 'Unsupported payment provider';
  END IF;

  SELECT * INTO v_host FROM pet_hosts WHERE id = p_host_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Host not found';
  END IF;
  IF v_host.is_available IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Host is not available';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_payment FROM payments WHERE idempotency_key = p_idempotency_key;
    IF FOUND AND v_payment.booking_id IS NOT NULL THEN
      SELECT * INTO v_booking FROM hosting_bookings WHERE id = v_payment.booking_id;
      SELECT * INTO v_escrow FROM escrow_accounts WHERE booking_id = v_booking.id;
      RETURN jsonb_build_object(
        'booking', to_jsonb(v_booking),
        'payment', to_jsonb(v_payment),
        'escrow', to_jsonb(v_escrow),
        'quote', public.monetisation_quote_booking(p_host_id, p_service_type, p_start_date, p_end_date, v_currency)
      );
    END IF;
  END IF;

  v_quote := public.monetisation_quote_booking(p_host_id, p_service_type, p_start_date, p_end_date, v_currency);

  INSERT INTO hosting_bookings (
    host_id, pet_name, pet_type, service_type, start_date, end_date,
    owner_name, owner_email, owner_phone, city, special_instructions,
    quoted_price, platform_fee, total_price,
    base_amount, guest_fee_amount, host_payout_fee_pct,
    units, owner_user_id,
    status, payment_status, escrow_status, release_status
  ) VALUES (
    p_host_id, trim(p_pet_name), trim(p_pet_type), trim(p_service_type), p_start_date, p_end_date,
    trim(p_owner_name), lower(trim(p_owner_email)), nullif(trim(p_owner_phone), ''), nullif(trim(p_city), ''), nullif(trim(p_special_instructions), ''),
    (v_quote->>'base_amount')::numeric,
    (v_quote->>'guest_fee_amount')::numeric,
    (v_quote->>'total_amount')::numeric,
    (v_quote->>'base_amount')::numeric,
    (v_quote->>'guest_fee_amount')::numeric,
    (v_quote->>'host_payout_fee_pct')::numeric,
    (v_quote->>'units')::integer,
    v_user_id,
    'pending', 'unpaid', 'pending_payment', 'blocked'
  )
  RETURNING * INTO v_booking;

  INSERT INTO payments (
    payment_type, gateway, payment_provider, amount, currency, status,
    reference_id, booking_id, payer_name, payer_email,
    idempotency_key, notes
  ) VALUES (
    'booking_escrow', coalesce(p_payment_provider, 'manual'), p_payment_provider,
    (v_quote->>'total_amount')::numeric, v_currency, 'requires_payment',
    v_booking.id::text, v_booking.id, trim(p_owner_name), lower(trim(p_owner_email)),
    p_idempotency_key,
    'Escrow pay-in for hosting booking'
  )
  RETURNING * INTO v_payment;

  UPDATE hosting_bookings
  SET payment_id = v_payment.id
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  INSERT INTO escrow_accounts (
    booking_id, host_id, currency,
    base_amount, guest_fee_amount, gross_amount,
    host_earnings, platform_revenue,
    status, payment_id
  ) VALUES (
    v_booking.id, p_host_id, v_currency,
    (v_quote->>'base_amount')::numeric,
    (v_quote->>'guest_fee_amount')::numeric,
    (v_quote->>'total_amount')::numeric,
    (v_quote->>'base_amount')::numeric,
    (v_quote->>'guest_fee_amount')::numeric,
    'pending_payment', v_payment.id
  )
  RETURNING * INTO v_escrow;

  PERFORM public.monetisation_append_ledger(
    'pay_in', (v_quote->>'total_amount')::numeric, v_currency, 'credit',
    v_booking.id, v_escrow.id, v_payment.id, NULL, p_host_id,
    v_user_id, v_user_email, 'Booking payment intent created',
    jsonb_build_object('provider', p_payment_provider, 'status', 'requires_payment')
  );

  RETURN jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'payment', to_jsonb(v_payment),
    'escrow', to_jsonb(v_escrow),
    'quote', v_quote
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: capture payment (placeholder until gateway webhooks)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_capture_booking_payment(
  p_booking_id UUID,
  p_provider_payment_id TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT := public.monetisation_current_user_email();
  v_booking hosting_bookings%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_escrow escrow_accounts%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM hosting_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF lower(v_booking.owner_email) <> lower(v_user_email) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = v_booking.payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF v_payment.status IN ('captured', 'completed') THEN
    SELECT * INTO v_escrow FROM escrow_accounts WHERE booking_id = p_booking_id;
    RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'payment', to_jsonb(v_payment), 'escrow', to_jsonb(v_escrow));
  END IF;

  UPDATE payments
  SET status = 'captured',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      idempotency_key = coalesce(p_idempotency_key, idempotency_key)
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  UPDATE hosting_bookings
  SET payment_status = 'paid',
      status = 'confirmed',
      escrow_status = 'held',
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  UPDATE escrow_accounts
  SET status = 'held', updated_at = now()
  WHERE booking_id = p_booking_id
  RETURNING * INTO v_escrow;

  PERFORM public.monetisation_append_ledger(
    'escrow_hold', v_escrow.gross_amount, v_escrow.currency, 'debit',
    v_booking.id, v_escrow.id, v_payment.id, NULL, v_escrow.host_id,
    public.monetisation_current_user_id(), v_user_email,
    'Payment captured; funds held in escrow',
    jsonb_build_object('provider_payment_id', p_provider_payment_id)
  );

  PERFORM public.monetisation_append_ledger(
    'platform_guest_fee', v_escrow.guest_fee_amount, v_escrow.currency, 'credit',
    v_booking.id, v_escrow.id, v_payment.id, NULL, v_escrow.host_id,
    public.monetisation_current_user_id(), v_user_email,
    'Platform guest service fee recorded',
    '{}'::jsonb
  );

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'payment', to_jsonb(v_payment), 'escrow', to_jsonb(v_escrow));
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: mark booking completed and evaluate release eligibility
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_mark_booking_completed(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking hosting_bookings%ROWTYPE;
  v_escrow escrow_accounts%ROWTYPE;
  v_host pet_hosts%ROWTYPE;
  v_release_at TIMESTAMPTZ;
  v_can_auto BOOLEAN := false;
BEGIN
  SELECT * INTO v_booking FROM hosting_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF NOT public.is_admin()
     AND NOT public.monetisation_host_owned_by_user(v_booking.host_id)
     AND lower(v_booking.owner_email) <> lower(public.monetisation_current_user_email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE hosting_bookings
  SET status = 'completed', updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  SELECT * INTO v_escrow FROM escrow_accounts WHERE booking_id = p_booking_id FOR UPDATE;
  SELECT * INTO v_host FROM pet_hosts WHERE id = v_booking.host_id;

  IF v_escrow.status = 'held' THEN
    v_can_auto := v_host.trusted_release_enabled = true
      AND v_host.trust_level IN ('trusted', 'premium')
      AND coalesce(v_host.completed_booking_count, 0) >= 10
      AND coalesce(v_host.rating, 0) >= 4.7
      AND coalesce(v_host.dispute_count, 0) = 0;

    v_release_at := now() + make_interval(hours => greatest(coalesce(v_host.auto_release_after_hours, 24), 1));

    UPDATE escrow_accounts
    SET status = 'release_pending',
        release_eligible_at = v_release_at,
        updated_at = now()
    WHERE id = v_escrow.id
    RETURNING * INTO v_escrow;

    UPDATE hosting_bookings
    SET escrow_status = 'release_pending',
        release_status = CASE WHEN v_can_auto THEN 'eligible' ELSE 'blocked' END,
        updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

    IF v_can_auto AND v_release_at <= now() + interval '1 second' THEN
      RETURN public.monetisation_release_escrow(p_booking_id);
    END IF;
  END IF;

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'escrow', to_jsonb(v_escrow));
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: release escrow to host pending balance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_release_escrow(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking hosting_bookings%ROWTYPE;
  v_escrow escrow_accounts%ROWTYPE;
  v_host pet_hosts%ROWTYPE;
  v_balance host_balances%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM hosting_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  SELECT * INTO v_escrow FROM escrow_accounts WHERE booking_id = p_booking_id FOR UPDATE;

  IF NOT public.is_admin() THEN
    SELECT * INTO v_host FROM pet_hosts WHERE id = v_booking.host_id;
    IF NOT (
      v_host.trusted_release_enabled = true
      AND v_host.trust_level IN ('trusted', 'premium')
      AND v_escrow.release_eligible_at IS NOT NULL
      AND v_escrow.release_eligible_at <= now()
    ) THEN
      RAISE EXCEPTION 'Manual admin release required';
    END IF;
  END IF;
  IF v_escrow.status NOT IN ('held', 'release_pending') THEN
    RAISE EXCEPTION 'Escrow is not releasable';
  END IF;
  IF v_escrow.status = 'release_pending' AND v_escrow.release_eligible_at IS NOT NULL AND v_escrow.release_eligible_at > now() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Release window not reached';
  END IF;

  v_balance := public.monetisation_ensure_host_balance(v_escrow.host_id, v_escrow.currency);

  UPDATE host_balances
  SET available_balance = available_balance + v_escrow.host_earnings,
      lifetime_earned = lifetime_earned + v_escrow.host_earnings,
      updated_at = now()
  WHERE host_id = v_escrow.host_id
  RETURNING * INTO v_balance;

  UPDATE escrow_accounts
  SET status = 'released', released_at = now(), updated_at = now()
  WHERE id = v_escrow.id
  RETURNING * INTO v_escrow;

  UPDATE hosting_bookings
  SET escrow_status = 'released',
      release_status = 'released',
      funds_released_at = now(),
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  UPDATE pet_hosts
  SET completed_booking_count = coalesce(completed_booking_count, 0) + 1,
      updated_at = now()
  WHERE id = v_escrow.host_id;

  PERFORM public.monetisation_append_ledger(
    'release_to_host', v_escrow.host_earnings, v_escrow.currency, 'credit',
    v_booking.id, v_escrow.id, v_escrow.payment_id, NULL, v_escrow.host_id,
    public.monetisation_current_user_id(), public.monetisation_current_user_email(),
    'Escrow released to host available balance', '{}'::jsonb
  );

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'escrow', to_jsonb(v_escrow), 'balance', to_jsonb(v_balance));
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: host payout request
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_request_host_payout(
  p_host_id UUID,
  p_gross_amount NUMERIC,
  p_payment_provider TEXT DEFAULT 'bank_transfer',
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT := public.monetisation_current_user_email();
  v_settings platform_fee_settings;
  v_balance host_balances%ROWTYPE;
  v_fee NUMERIC;
  v_net NUMERIC;
  v_payout host_payout_requests%ROWTYPE;
BEGIN
  IF v_user_email IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public.monetisation_host_owned_by_user(p_host_id) THEN
    RAISE EXCEPTION 'Not authorized for this host profile';
  END IF;
  IF NOT public.monetisation_is_supported_provider(p_payment_provider) THEN
    RAISE EXCEPTION 'Unsupported payout provider';
  END IF;
  IF p_gross_amount IS NULL OR p_gross_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payout amount';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_payout FROM host_payout_requests WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('payout', to_jsonb(v_payout));
    END IF;
  END IF;

  v_balance := public.monetisation_ensure_host_balance(p_host_id);
  IF p_gross_amount > v_balance.available_balance THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  v_settings := public.monetisation_get_active_fee_settings(v_balance.currency);
  v_fee := public.monetisation_calc_pct_fee(
    p_gross_amount,
    coalesce(v_settings.host_payout_fee_pct, 2),
    coalesce(v_settings.host_payout_fee_min, 0),
    v_settings.host_payout_fee_max
  );
  v_net := public.monetisation_round_money(p_gross_amount - v_fee);
  IF v_net <= 0 THEN
    RAISE EXCEPTION 'Payout amount too small after fees';
  END IF;

  UPDATE host_balances
  SET available_balance = available_balance - p_gross_amount,
      updated_at = now()
  WHERE host_id = p_host_id
  RETURNING * INTO v_balance;

  INSERT INTO host_payout_requests (
    host_id, currency, gross_amount, payout_fee_pct, payout_fee_amount, net_amount,
    status, payment_provider, idempotency_key, notes, requested_by_email
  ) VALUES (
    p_host_id, v_balance.currency, p_gross_amount,
    coalesce(v_settings.host_payout_fee_pct, 2), v_fee, v_net,
    'pending', p_payment_provider, p_idempotency_key, nullif(trim(p_notes), ''), v_user_email
  )
  RETURNING * INTO v_payout;

  PERFORM public.monetisation_append_ledger(
    'payout_requested', p_gross_amount, v_balance.currency, 'debit',
    NULL, NULL, NULL, v_payout.id, p_host_id,
    public.monetisation_current_user_id(), v_user_email,
    'Host payout requested', jsonb_build_object('net_amount', v_net, 'fee', v_fee)
  );

  PERFORM public.monetisation_append_ledger(
    'payout_fee', v_fee, v_balance.currency, 'credit',
    NULL, NULL, NULL, v_payout.id, p_host_id,
    public.monetisation_current_user_id(), v_user_email,
    'Host payout platform fee', '{}'::jsonb
  );

  RETURN jsonb_build_object('payout', to_jsonb(v_payout), 'balance', to_jsonb(v_balance));
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin approve / mark payout paid
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_admin_update_payout_status(
  p_payout_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_provider_payout_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout host_payout_requests%ROWTYPE;
  v_balance host_balances%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_status NOT IN ('approved', 'processing', 'paid', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid payout status';
  END IF;

  SELECT * INTO v_payout FROM host_payout_requests WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout request not found'; END IF;

  IF p_status = 'rejected' OR p_status = 'cancelled' THEN
    v_balance := public.monetisation_ensure_host_balance(v_payout.host_id, v_payout.currency);
    UPDATE host_balances
    SET available_balance = available_balance + v_payout.gross_amount,
        updated_at = now()
    WHERE host_id = v_payout.host_id
    RETURNING * INTO v_balance;
  END IF;

  UPDATE host_payout_requests
  SET status = p_status,
      admin_notes = coalesce(nullif(trim(p_admin_notes), ''), admin_notes),
      provider_payout_id = coalesce(p_provider_payout_id, provider_payout_id),
      approved_at = CASE WHEN p_status = 'approved' THEN now() ELSE approved_at END,
      paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END,
      updated_at = now()
  WHERE id = p_payout_id
  RETURNING * INTO v_payout;

  IF p_status = 'paid' THEN
    UPDATE host_balances
    SET lifetime_paid_out = lifetime_paid_out + v_payout.net_amount,
        updated_at = now()
    WHERE host_id = v_payout.host_id
    RETURNING * INTO v_balance;

    PERFORM public.monetisation_append_ledger(
      'payout_paid', v_payout.net_amount, v_payout.currency, 'debit',
      NULL, NULL, NULL, v_payout.id, v_payout.host_id,
      public.monetisation_current_user_id(), public.monetisation_current_user_email(),
      'Host payout marked paid', jsonb_build_object('provider_payout_id', p_provider_payout_id)
    );
  END IF;

  RETURN jsonb_build_object('payout', to_jsonb(v_payout), 'balance', to_jsonb(v_balance));
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE platform_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_fee_settings_public_read ON platform_fee_settings
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY platform_fee_settings_admin_write ON platform_fee_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY escrow_accounts_participant_read ON escrow_accounts
  FOR SELECT USING (
    public.is_admin()
    OR booking_id IN (
      SELECT id FROM hosting_bookings
      WHERE owner_email = public.monetisation_current_user_email()
    )
    OR public.monetisation_host_owned_by_user(host_id)
  );

CREATE POLICY ledger_entries_participant_read ON ledger_entries
  FOR SELECT USING (
    public.is_admin()
    OR booking_id IN (
      SELECT id FROM hosting_bookings
      WHERE owner_email = public.monetisation_current_user_email()
    )
    OR public.monetisation_host_owned_by_user(host_id)
    OR host_id IS NOT NULL AND public.monetisation_host_owned_by_user(host_id)
  );

CREATE POLICY host_balances_host_read ON host_balances
  FOR SELECT USING (public.is_admin() OR public.monetisation_host_owned_by_user(host_id));

CREATE POLICY host_payout_requests_participant_read ON host_payout_requests
  FOR SELECT USING (public.is_admin() OR public.monetisation_host_owned_by_user(host_id));

-- Block direct client writes to financial tables (RPC only)
CREATE POLICY escrow_accounts_no_client_write ON escrow_accounts
  FOR INSERT WITH CHECK (false);
CREATE POLICY escrow_accounts_no_client_update ON escrow_accounts
  FOR UPDATE USING (false);
CREATE POLICY escrow_accounts_no_client_delete ON escrow_accounts
  FOR DELETE USING (false);

CREATE POLICY ledger_entries_no_client_write ON ledger_entries
  FOR INSERT WITH CHECK (false);
CREATE POLICY ledger_entries_no_client_update ON ledger_entries
  FOR UPDATE USING (false);
CREATE POLICY ledger_entries_no_client_delete ON ledger_entries
  FOR DELETE USING (false);

CREATE POLICY host_balances_no_client_write ON host_balances
  FOR INSERT WITH CHECK (false);
CREATE POLICY host_balances_no_client_update ON host_balances
  FOR UPDATE USING (false);
CREATE POLICY host_balances_no_client_delete ON host_balances
  FOR DELETE USING (false);

CREATE POLICY host_payout_requests_no_client_write ON host_payout_requests
  FOR INSERT WITH CHECK (false);
CREATE POLICY host_payout_requests_no_client_update ON host_payout_requests
  FOR UPDATE USING (false);
CREATE POLICY host_payout_requests_no_client_delete ON host_payout_requests
  FOR DELETE USING (false);

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION public.monetisation_quote_booking(UUID, TEXT, DATE, DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_create_hosting_booking(UUID, TEXT, DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_capture_booking_payment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_mark_booking_completed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_release_escrow(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_request_host_payout(UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_admin_update_payout_status(UUID, TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.monetisation_append_ledger(TEXT, NUMERIC, TEXT, TEXT, UUID, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.monetisation_ensure_host_balance(UUID, TEXT) FROM PUBLIC;
