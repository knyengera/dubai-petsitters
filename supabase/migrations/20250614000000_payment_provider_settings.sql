-- Payment provider feature toggles and capture RPC extensions

CREATE TABLE IF NOT EXISTS payment_provider_settings (
  provider_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  currencies TEXT NOT NULL DEFAULT 'SAR',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  integration_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (integration_mode IN ('live', 'manual')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

INSERT INTO payment_provider_settings (provider_id, display_name, currencies, is_enabled, sort_order, integration_mode)
VALUES
  ('stripe', 'Stripe', 'Multi', true, 1, 'live'),
  ('paypal', 'PayPal', 'USD / SAR', true, 2, 'live'),
  ('payfast', 'PayFast', 'ZAR / SAR', false, 3, 'manual'),
  ('salla', 'Salla', 'SAR', false, 4, 'manual'),
  ('hyperpay', 'HyperPay', 'SAR', false, 5, 'manual'),
  ('moyasar', 'Moyasar', 'SAR', false, 6, 'manual'),
  ('tap', 'Tap', 'SAR', false, 7, 'manual'),
  ('bank_transfer', 'Bank Transfer', 'SAR', true, 8, 'manual'),
  ('manual', 'Manual', 'SAR', true, 9, 'manual')
ON CONFLICT (provider_id) DO NOTHING;

ALTER TABLE payment_provider_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_provider_settings_public_read ON payment_provider_settings
  FOR SELECT USING (is_enabled = true OR public.is_admin());

CREATE POLICY payment_provider_settings_admin_write ON payment_provider_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPC: list enabled payment providers (public)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_enabled_payment_providers()
RETURNS SETOF payment_provider_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM payment_provider_settings
  WHERE is_enabled = true
  ORDER BY sort_order ASC, display_name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_enabled_payment_providers() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: check if provider is enabled
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_payment_provider_enabled(p_provider_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM payment_provider_settings
    WHERE provider_id = p_provider_id AND is_enabled = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_payment_provider_enabled(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: capture booking payment (hardened for Stripe/PayPal)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_capture_booking_payment(
  p_booking_id UUID,
  p_provider_payment_id TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_provider_payload JSONB DEFAULT NULL
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
  v_is_service BOOLEAN := (auth.role() = 'service_role');
BEGIN
  SELECT * INTO v_booking FROM hosting_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF NOT v_is_service THEN
    IF lower(v_booking.owner_email) <> lower(v_user_email) AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = v_booking.payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF NOT v_is_service
     AND NOT public.is_admin()
     AND coalesce(v_payment.payment_provider, v_payment.gateway) IN ('stripe', 'paypal') THEN
    RAISE EXCEPTION 'Stripe and PayPal payments must be confirmed via payment gateway webhook';
  END IF;

  IF v_payment.status IN ('captured', 'completed') THEN
    SELECT * INTO v_escrow FROM escrow_accounts WHERE booking_id = p_booking_id;
    RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'payment', to_jsonb(v_payment), 'escrow', to_jsonb(v_escrow));
  END IF;

  UPDATE payments
  SET status = 'captured',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      idempotency_key = coalesce(p_idempotency_key, idempotency_key),
      provider_payload = coalesce(p_provider_payload, provider_payload)
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
    public.monetisation_current_user_id(), coalesce(v_user_email, 'system'),
    'Payment captured; funds held in escrow',
    jsonb_build_object('provider_payment_id', p_provider_payment_id)
  );

  PERFORM public.monetisation_append_ledger(
    'platform_guest_fee', v_escrow.guest_fee_amount, v_escrow.currency, 'credit',
    v_booking.id, v_escrow.id, v_payment.id, NULL, v_escrow.host_id,
    public.monetisation_current_user_id(), coalesce(v_user_email, 'system'),
    'Platform guest service fee recorded',
    '{}'::jsonb
  );

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'payment', to_jsonb(v_payment), 'escrow', to_jsonb(v_escrow));
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: activate vet subscription after payment
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_activate_vet_subscription(p_payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_sub vet_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.payment_type <> 'vet_subscription' THEN
    RAISE EXCEPTION 'Payment is not a vet subscription';
  END IF;

  IF v_payment.reference_id IS NULL THEN
    RAISE EXCEPTION 'Payment missing subscription reference';
  END IF;

  SELECT * INTO v_sub FROM vet_subscriptions WHERE id = v_payment.reference_id::uuid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  UPDATE vet_subscriptions
  SET status = 'active',
      payment_id = v_payment.id,
      updated_at = now()
  WHERE id = v_sub.id
  RETURNING * INTO v_sub;

  RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'subscription', to_jsonb(v_sub));
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: generic payment capture (vet, partner, manual admin)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_capture_payment(
  p_payment_id UUID,
  p_provider_payment_id TEXT DEFAULT NULL,
  p_provider_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_is_service BOOLEAN := (auth.role() = 'service_role');
  v_user_email TEXT := public.monetisation_current_user_email();
  v_result JSONB;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.status IN ('captured', 'completed') THEN
    RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'already_captured', true);
  END IF;

  IF NOT v_is_service THEN
    IF NOT public.is_admin()
       AND lower(coalesce(v_payment.payer_email, '')) <> lower(coalesce(v_user_email, '')) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;

    IF NOT public.is_admin()
       AND coalesce(v_payment.payment_provider, v_payment.gateway) IN ('stripe', 'paypal') THEN
      RAISE EXCEPTION 'Stripe and PayPal payments must be confirmed via payment gateway webhook';
    END IF;
  END IF;

  IF v_payment.payment_type = 'booking_escrow' THEN
    IF v_payment.booking_id IS NULL THEN
      RAISE EXCEPTION 'Booking payment missing booking_id';
    END IF;
    RETURN public.monetisation_capture_booking_payment(
      v_payment.booking_id,
      p_provider_payment_id,
      NULL,
      p_provider_payload
    );
  END IF;

  UPDATE payments
  SET status = 'captured',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      provider_payload = coalesce(p_provider_payload, provider_payload),
      gateway_transaction_id = coalesce(p_provider_payment_id, gateway_transaction_id)
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  IF v_payment.payment_type = 'vet_subscription' THEN
    v_result := public.monetisation_activate_vet_subscription(v_payment.id);
    RETURN v_result || jsonb_build_object('payment', to_jsonb(v_payment));
  END IF;

  IF v_payment.payment_type = 'partner_advertising' AND v_payment.reference_id IS NOT NULL THEN
    UPDATE partner_inquiries
    SET status = 'paid',
        updated_at = now()
    WHERE id = v_payment.reference_id::uuid;
  END IF;

  RETURN jsonb_build_object('payment', to_jsonb(v_payment));
END;
$$;

GRANT EXECUTE ON FUNCTION public.monetisation_capture_payment(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_activate_vet_subscription(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.monetisation_capture_payment(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.monetisation_activate_vet_subscription(UUID) FROM PUBLIC;
