-- Host availability calendar: guest-safe read RPC and booking enforcement

CREATE OR REPLACE FUNCTION public.monetisation_service_nights(
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS DATE[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_nights DATE[] := ARRAY[]::DATE[];
  v_cur DATE;
  v_last DATE;
BEGIN
  IF p_start_date IS NULL THEN
    RETURN v_nights;
  END IF;

  IF p_end_date IS NOT NULL AND p_end_date > p_start_date THEN
    v_last := p_end_date - 1;
  ELSE
    v_last := p_start_date;
  END IF;

  v_cur := p_start_date;
  WHILE v_cur <= v_last LOOP
    v_nights := array_append(v_nights, v_cur);
    v_cur := v_cur + 1;
  END LOOP;

  RETURN v_nights;
END;
$$;

CREATE OR REPLACE FUNCTION public.monetisation_assert_dates_bookable(
  p_host_id UUID,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host pet_hosts%ROWTYPE;
  v_night DATE;
  v_nights DATE[];
  v_blocked DATE;
  v_booking hosting_bookings%ROWTYPE;
  v_existing_nights DATE[];
  v_overlap DATE;
BEGIN
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'Start date is required';
  END IF;

  IF p_start_date < current_date THEN
    RAISE EXCEPTION 'Start date cannot be in the past';
  END IF;

  IF p_end_date IS NOT NULL AND p_end_date < p_start_date THEN
    RAISE EXCEPTION 'End date cannot be before start date';
  END IF;

  SELECT * INTO v_host FROM pet_hosts WHERE id = p_host_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Host not found';
  END IF;

  IF v_host.is_available IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Host is not available';
  END IF;

  v_nights := public.monetisation_service_nights(p_start_date, p_end_date);

  FOREACH v_night IN ARRAY v_nights LOOP
    SELECT date INTO v_blocked
    FROM host_availability
    WHERE host_id = p_host_id
      AND date = v_night
      AND is_available = false
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'Selected dates are not available';
    END IF;
  END LOOP;

  FOR v_booking IN
    SELECT *
    FROM hosting_bookings
    WHERE host_id = p_host_id
      AND start_date IS NOT NULL
      AND lower(coalesce(status, '')) NOT IN ('cancelled', 'rejected')
  LOOP
    v_existing_nights := public.monetisation_service_nights(v_booking.start_date, v_booking.end_date);

    FOREACH v_overlap IN ARRAY v_existing_nights LOOP
      IF v_overlap = ANY(v_nights) THEN
        RAISE EXCEPTION 'Selected dates are not available';
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_host_booking_calendar(
  p_host_id UUID,
  p_from DATE DEFAULT current_date,
  p_to DATE DEFAULT (current_date + interval '6 months')::date
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host pet_hosts%ROWTYPE;
  v_blocked_dates JSONB := '[]'::jsonb;
  v_booked_dates JSONB := '[]'::jsonb;
  v_custom_prices JSONB := '[]'::jsonb;
  v_booking hosting_bookings%ROWTYPE;
  v_night DATE;
  v_nights DATE[];
BEGIN
  SELECT * INTO v_host FROM pet_hosts WHERE id = p_host_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Host not found';
  END IF;

  IF v_host.is_available IS DISTINCT FROM true THEN
    RETURN jsonb_build_object(
      'host_available', false,
      'blocked_dates', '[]'::jsonb,
      'booked_dates', '[]'::jsonb,
      'custom_prices', '[]'::jsonb
    );
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(date::text) ORDER BY date), '[]'::jsonb)
  INTO v_blocked_dates
  FROM host_availability
  WHERE host_id = p_host_id
    AND date >= p_from
    AND date <= p_to
    AND is_available = false;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object('date', to_jsonb(date::text), 'price', price_override)
      ORDER BY date
    ),
    '[]'::jsonb
  )
  INTO v_custom_prices
  FROM host_availability
  WHERE host_id = p_host_id
    AND date >= p_from
    AND date <= p_to
    AND is_available IS DISTINCT FROM false
    AND price_override IS NOT NULL
    AND price_override > 0;

  FOR v_booking IN
    SELECT *
    FROM hosting_bookings
    WHERE host_id = p_host_id
      AND start_date IS NOT NULL
      AND lower(coalesce(status, '')) NOT IN ('cancelled', 'rejected')
      AND start_date <= p_to
      AND coalesce(end_date, start_date) >= p_from
  LOOP
    v_nights := public.monetisation_service_nights(v_booking.start_date, v_booking.end_date);
    FOREACH v_night IN ARRAY v_nights LOOP
      IF v_night >= p_from AND v_night <= p_to THEN
        v_booked_dates := v_booked_dates || to_jsonb(v_night::text);
      END IF;
    END LOOP;
  END LOOP;

  SELECT coalesce(jsonb_agg(DISTINCT value ORDER BY value), '[]'::jsonb)
  INTO v_booked_dates
  FROM jsonb_array_elements(v_booked_dates) AS t(value);

  RETURN jsonb_build_object(
    'host_available', true,
    'blocked_dates', v_blocked_dates,
    'booked_dates', v_booked_dates,
    'custom_prices', v_custom_prices
  );
END;
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
  PERFORM public.monetisation_assert_dates_bookable(p_host_id, p_start_date, p_end_date);

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

  PERFORM public.monetisation_assert_dates_bookable(p_host_id, p_start_date, p_end_date);

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

GRANT EXECUTE ON FUNCTION public.get_host_booking_calendar(UUID, DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_service_nights(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_assert_dates_bookable(UUID, DATE, DATE) TO authenticated;
