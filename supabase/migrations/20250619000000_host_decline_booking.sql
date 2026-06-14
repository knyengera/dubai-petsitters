-- Host decline for pending unpaid booking requests
CREATE OR REPLACE FUNCTION public.host_decline_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking hosting_bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM hosting_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF NOT public.monetisation_host_owned_by_user(v_booking.host_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_booking.status <> 'pending' OR v_booking.payment_status <> 'unpaid' THEN
    RAISE EXCEPTION 'Only pending unpaid bookings can be declined';
  END IF;

  UPDATE hosting_bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object('booking', to_jsonb(v_booking));
END;
$$;

GRANT EXECUTE ON FUNCTION public.host_decline_booking(UUID) TO authenticated;
