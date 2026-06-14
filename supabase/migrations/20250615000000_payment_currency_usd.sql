-- Switch platform payment currency from SAR to USD

UPDATE payment_provider_settings SET currencies = 'USD';

UPDATE platform_fee_settings
SET is_active = false, effective_until = now()
WHERE currency = 'SAR' AND is_active = true;

INSERT INTO platform_fee_settings (
  name, guest_service_fee_pct, host_payout_fee_pct, currency, is_active, effective_from
)
SELECT 'default', 10, 2, 'USD', true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM platform_fee_settings WHERE currency = 'USD' AND is_active = true
);

ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE platform_fee_settings ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE escrow_accounts ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE host_balances ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE host_payout_requests ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE ledger_entries ALTER COLUMN currency SET DEFAULT 'USD';

CREATE OR REPLACE FUNCTION public.monetisation_get_active_fee_settings(p_currency TEXT DEFAULT 'USD')
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

CREATE OR REPLACE FUNCTION public.monetisation_quote_booking(
  p_host_id UUID,
  p_service_type TEXT,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD'
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

CREATE OR REPLACE FUNCTION public.monetisation_ensure_host_balance(p_host_id UUID, p_currency TEXT DEFAULT 'USD')
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
  v_currency TEXT := 'USD';
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
