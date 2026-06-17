-- Escrow refunds: payment_refunds audit table, refunded_amount tracking, record RPC

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC NOT NULL DEFAULT 0
    CHECK (refunded_amount >= 0);

ALTER TABLE escrow_accounts
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC NOT NULL DEFAULT 0
    CHECK (refunded_amount >= 0);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES hosting_bookings(id) ON DELETE CASCADE,
  escrow_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  provider TEXT NOT NULL,
  provider_refund_id TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded'
    CHECK (status IN ('pending', 'succeeded', 'failed')),
  host_clawback_amount NUMERIC NOT NULL DEFAULT 0 CHECK (host_clawback_amount >= 0),
  actor_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_refunds_provider_refund_id
  ON payment_refunds(provider_refund_id)
  WHERE provider_refund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_booking ON payment_refunds(booking_id);

-- ---------------------------------------------------------------------------
-- RPC: record escrow refund (admin or service_role webhook reconciliation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monetisation_record_escrow_refund(
  p_booking_id UUID,
  p_amount NUMERIC,
  p_provider_refund_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT := public.monetisation_current_user_email();
  v_is_service BOOLEAN := (auth.role() = 'service_role');
  v_booking hosting_bookings%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_escrow escrow_accounts%ROWTYPE;
  v_balance host_balances%ROWTYPE;
  v_refund payment_refunds%ROWTYPE;
  v_host_clawback NUMERIC := 0;
  v_new_refunded NUMERIC;
  v_fully_refunded BOOLEAN;
BEGIN
  IF NOT v_is_service AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_provider_refund_id IS NOT NULL THEN
    SELECT * INTO v_refund FROM payment_refunds WHERE provider_refund_id = p_provider_refund_id;
    IF FOUND THEN
      SELECT * INTO v_booking FROM hosting_bookings WHERE id = v_refund.booking_id;
      SELECT * INTO v_payment FROM payments WHERE id = v_refund.payment_id;
      SELECT * INTO v_escrow FROM escrow_accounts WHERE id = v_refund.escrow_id;
      RETURN jsonb_build_object(
        'booking', to_jsonb(v_booking),
        'payment', to_jsonb(v_payment),
        'escrow', to_jsonb(v_escrow),
        'refund', to_jsonb(v_refund),
        'idempotent', true
      );
    END IF;
  END IF;

  SELECT * INTO v_booking FROM hosting_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT * INTO v_escrow FROM escrow_accounts WHERE booking_id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow account not found';
  END IF;

  IF v_escrow.status NOT IN ('held', 'release_pending', 'released') THEN
    RAISE EXCEPTION 'Escrow is not refundable';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive';
  END IF;

  IF v_escrow.refunded_amount + p_amount > v_escrow.gross_amount THEN
    RAISE EXCEPTION 'Refund amount exceeds refundable balance';
  END IF;

  SELECT * INTO v_payment FROM payments WHERE id = v_escrow.payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_escrow.status = 'released' AND v_escrow.gross_amount > 0 THEN
    v_host_clawback := round((p_amount / v_escrow.gross_amount) * v_escrow.host_earnings, 2);
    IF v_host_clawback > 0 THEN
      v_balance := public.monetisation_ensure_host_balance(v_escrow.host_id, v_escrow.currency);
      IF v_balance.available_balance < v_host_clawback THEN
        RAISE EXCEPTION 'Insufficient host balance for clawback';
      END IF;
      UPDATE host_balances
      SET available_balance = available_balance - v_host_clawback,
          lifetime_earned = greatest(0, lifetime_earned - v_host_clawback),
          updated_at = now()
      WHERE host_id = v_escrow.host_id
      RETURNING * INTO v_balance;
    END IF;
  END IF;

  v_new_refunded := v_escrow.refunded_amount + p_amount;
  v_fully_refunded := v_new_refunded >= v_escrow.gross_amount;

  UPDATE payments
  SET refunded_amount = v_new_refunded,
      status = CASE WHEN v_fully_refunded THEN 'refunded' ELSE status END
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  UPDATE escrow_accounts
  SET refunded_amount = v_new_refunded,
      status = CASE WHEN v_fully_refunded THEN 'refunded' ELSE status END,
      updated_at = now()
  WHERE id = v_escrow.id
  RETURNING * INTO v_escrow;

  IF v_fully_refunded THEN
    UPDATE hosting_bookings
    SET escrow_status = 'refunded',
        payment_status = 'refunded',
        updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;
  END IF;

  PERFORM public.monetisation_append_ledger(
    'refund', p_amount, v_escrow.currency, 'debit',
    v_booking.id, v_escrow.id, v_payment.id, NULL, v_escrow.host_id,
    public.monetisation_current_user_id(), v_user_email,
    coalesce(p_reason, 'Escrow refund to guest'),
    jsonb_build_object(
      'provider_refund_id', p_provider_refund_id,
      'provider', coalesce(v_payment.payment_provider, v_payment.gateway)
    ) || coalesce(p_metadata, '{}'::jsonb)
  );

  IF v_host_clawback > 0 THEN
    PERFORM public.monetisation_append_ledger(
      'adjustment', v_host_clawback, v_escrow.currency, 'debit',
      v_booking.id, v_escrow.id, v_payment.id, NULL, v_escrow.host_id,
      public.monetisation_current_user_id(), v_user_email,
      'Host balance clawback for escrow refund',
      jsonb_build_object('refund_amount', p_amount, 'provider_refund_id', p_provider_refund_id)
    );
  END IF;

  INSERT INTO payment_refunds (
    payment_id, booking_id, escrow_id, amount, currency, provider,
    provider_refund_id, reason, status, host_clawback_amount, actor_email, metadata
  ) VALUES (
    v_payment.id, p_booking_id, v_escrow.id, p_amount, v_escrow.currency,
    coalesce(v_payment.payment_provider, v_payment.gateway),
    p_provider_refund_id, p_reason, 'succeeded', v_host_clawback,
    v_user_email, coalesce(p_metadata, '{}'::jsonb)
  )
  RETURNING * INTO v_refund;

  RETURN jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'payment', to_jsonb(v_payment),
    'escrow', to_jsonb(v_escrow),
    'refund', to_jsonb(v_refund),
    'host_clawback_amount', v_host_clawback
  );
END;
$$;

ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_refunds_admin_read ON payment_refunds
  FOR SELECT USING (public.is_admin());

CREATE POLICY payment_refunds_no_client_write ON payment_refunds
  FOR INSERT WITH CHECK (false);
CREATE POLICY payment_refunds_no_client_update ON payment_refunds
  FOR UPDATE USING (false);
CREATE POLICY payment_refunds_no_client_delete ON payment_refunds
  FOR DELETE USING (false);

GRANT EXECUTE ON FUNCTION public.monetisation_record_escrow_refund(UUID, NUMERIC, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monetisation_record_escrow_refund(UUID, NUMERIC, TEXT, TEXT, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.monetisation_record_escrow_refund(UUID, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC;
