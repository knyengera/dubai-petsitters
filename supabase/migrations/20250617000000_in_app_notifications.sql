-- In-app notification store: user_notifications table, insert helper, RLS, Realtime, trigger patches

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  template_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON user_notifications (user_id)
  WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- Insert helper (trigger-only; no client INSERT policy)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.insert_user_notification(
  p_user_id UUID,
  p_event_type TEXT,
  p_template_key TEXT,
  p_payload JSONB,
  p_idempotency_key TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.user_notifications (
    user_id, event_type, template_key, payload, idempotency_key
  ) VALUES (
    p_user_id, p_event_type, p_template_key, coalesce(p_payload, '{}'::jsonb), p_idempotency_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.insert_user_notification(UUID, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Patch trigger functions to also insert in-app notifications
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_on_booking_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_host RECORD;
  v_payload JSONB;
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_host FROM public.notification_host_contact(NEW.host_id);

  v_payload := jsonb_build_object(
    'booking_id', NEW.id,
    'host_id', NEW.host_id,
    'pet_name', NEW.pet_name,
    'owner_name', NEW.owner_name,
    'owner_email', NEW.owner_email,
    'start_date', NEW.start_date,
    'end_date', NEW.end_date,
    'service_type', NEW.service_type,
    'total_price', NEW.total_price
  );

  IF v_host.email IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'booking.request', 'email', 'booking.request',
      'booking.request:email:' || NEW.id::text || ':' || v_host.email,
      v_payload, v_host.user_id, v_host.email, NULL
    );
  END IF;

  IF v_host.phone IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'booking.request', 'sms', 'booking.request',
      'booking.request:sms:' || NEW.id::text || ':' || v_host.phone,
      v_payload, v_host.user_id, NULL, v_host.phone
    );
  END IF;

  IF v_host.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_host.user_id, 'booking.request', 'booking.request', v_payload,
      'booking.request:in_app:' || NEW.id::text || ':host'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_booking_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_host RECORD;
  v_owner RECORD;
  v_payload JSONB;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status IS DISTINCT FROM 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_host FROM public.notification_host_contact(NEW.host_id);
  SELECT * INTO v_owner FROM public.notification_profile_by_email(NEW.owner_email);

  v_payload := jsonb_build_object(
    'booking_id', NEW.id,
    'pet_name', NEW.pet_name,
    'owner_name', NEW.owner_name,
    'owner_email', NEW.owner_email,
    'host_name', v_host.full_name,
    'start_date', NEW.start_date,
    'end_date', NEW.end_date,
    'total_price', NEW.total_price
  );

  PERFORM public.enqueue_notification(
    'booking.confirmed', 'email', 'booking.confirmed',
    'booking.confirmed:owner:email:' || NEW.id::text,
    v_payload, NEW.owner_user_id, NEW.owner_email, NULL
  );
  IF coalesce(NEW.owner_phone, v_owner.phone) IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'booking.confirmed', 'sms', 'booking.confirmed',
      'booking.confirmed:owner:sms:' || NEW.id::text,
      v_payload, NEW.owner_user_id, NULL, coalesce(NEW.owner_phone, v_owner.phone)
    );
  END IF;

  IF NEW.owner_user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      NEW.owner_user_id, 'booking.confirmed', 'booking.confirmed', v_payload,
      'booking.confirmed:in_app:' || NEW.id::text || ':owner'
    );
  ELSIF v_owner.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_owner.user_id, 'booking.confirmed', 'booking.confirmed', v_payload,
      'booking.confirmed:in_app:' || NEW.id::text || ':owner'
    );
  END IF;

  IF v_host.email IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'booking.confirmed', 'email', 'booking.confirmed.host',
      'booking.confirmed:host:email:' || NEW.id::text,
      v_payload, v_host.user_id, v_host.email, NULL
    );
  END IF;
  IF v_host.phone IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'booking.confirmed', 'sms', 'booking.confirmed.host',
      'booking.confirmed:host:sms:' || NEW.id::text,
      v_payload, v_host.user_id, NULL, v_host.phone
    );
  END IF;

  IF v_host.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_host.user_id, 'booking.confirmed', 'booking.confirmed.host', v_payload,
      'booking.confirmed:in_app:' || NEW.id::text || ':host'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_payment_captured()
RETURNS TRIGGER AS $$
DECLARE
  v_owner RECORD;
  v_payload JSONB;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('captured', 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_owner FROM public.notification_profile_by_email(NEW.payer_email);

  v_payload := jsonb_build_object(
    'payment_id', NEW.id,
    'booking_id', NEW.booking_id,
    'amount', NEW.amount,
    'currency', NEW.currency,
    'payer_name', NEW.payer_name,
    'payer_email', NEW.payer_email,
    'payment_type', NEW.payment_type
  );

  PERFORM public.enqueue_notification(
    'payment.confirmed', 'email', 'payment.confirmed',
    'payment.confirmed:email:' || NEW.id::text,
    v_payload, v_owner.user_id, NEW.payer_email, NULL
  );

  IF v_owner.phone IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'payment.confirmed', 'sms', 'payment.confirmed',
      'payment.confirmed:sms:' || NEW.id::text,
      v_payload, v_owner.user_id, NULL, v_owner.phone
    );
  END IF;

  IF v_owner.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_owner.user_id, 'payment.confirmed', 'payment.confirmed', v_payload,
      'payment.confirmed:in_app:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_recipient_email TEXT;
  v_recipient_name TEXT;
  v_recipient_user_id UUID;
  v_recipient_phone TEXT;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF lower(NEW.sender_email) = lower(v_conv.owner_email) THEN
    v_recipient_email := v_conv.contact_email;
    v_recipient_name := v_conv.contact_name;
  ELSE
    v_recipient_email := v_conv.owner_email;
    v_recipient_name := v_conv.owner_name;
  END IF;

  IF v_recipient_email IS NULL OR lower(v_recipient_email) = lower(NEW.sender_email) THEN
    RETURN NEW;
  END IF;

  SELECT user_id, phone INTO v_recipient_user_id, v_recipient_phone
  FROM public.notification_profile_by_email(v_recipient_email);

  v_payload := jsonb_build_object(
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'sender_name', NEW.sender_name,
    'sender_email', NEW.sender_email,
    'preview', left(NEW.content, 120),
    'recipient_name', v_recipient_name
  );

  PERFORM public.enqueue_notification(
    'message.new', 'email', 'message.new',
    'message.new:email:' || NEW.id::text,
    v_payload, v_recipient_user_id, v_recipient_email, NULL,
    now() + interval '3 minutes'
  );

  IF v_recipient_phone IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'message.new', 'sms', 'message.new',
      'message.new:sms:' || NEW.id::text,
      v_payload, v_recipient_user_id, NULL, v_recipient_phone,
      now() + interval '3 minutes'
    );
  END IF;

  IF v_recipient_user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_recipient_user_id, 'message.new', 'message.new', v_payload,
      'message.new:in_app:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_appointment_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_owner RECORD;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_owner FROM public.notification_profile_by_email(NEW.owner_email);

  v_payload := jsonb_build_object(
    'appointment_id', NEW.id,
    'pet_name', NEW.pet_name,
    'clinic_name', NEW.clinic_name,
    'vet_name', NEW.vet_name,
    'date', NEW.date,
    'time', NEW.time,
    'type', NEW.type,
    'status', NEW.status,
    'owner_name', NEW.owner_name
  );

  PERFORM public.enqueue_notification(
    'appointment.request', 'email', 'appointment.request',
    'appointment.request:email:' || NEW.id::text,
    v_payload, v_owner.user_id, NEW.owner_email, NULL
  );

  IF v_owner.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_owner.user_id, 'appointment.request', 'appointment.request', v_payload,
      'appointment.request:in_app:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_appointment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_owner RECORD;
  v_payload JSONB;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_owner FROM public.notification_profile_by_email(NEW.owner_email);

  v_payload := jsonb_build_object(
    'appointment_id', NEW.id,
    'pet_name', NEW.pet_name,
    'clinic_name', NEW.clinic_name,
    'vet_name', NEW.vet_name,
    'date', NEW.date,
    'time', NEW.time,
    'type', NEW.type,
    'status', NEW.status,
    'owner_name', NEW.owner_name
  );

  PERFORM public.enqueue_notification(
    'appointment.status', 'email', 'appointment.status',
    'appointment.status:email:' || NEW.id::text || ':' || NEW.status,
    v_payload, v_owner.user_id, NEW.owner_email, NULL
  );

  IF coalesce(NEW.owner_phone, v_owner.phone) IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'appointment.status', 'sms', 'appointment.status',
      'appointment.status:sms:' || NEW.id::text || ':' || NEW.status,
      v_payload, v_owner.user_id, NULL, coalesce(NEW.owner_phone, v_owner.phone)
    );
  END IF;

  IF v_owner.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_owner.user_id, 'appointment.status', 'appointment.status', v_payload,
      'appointment.status:in_app:' || NEW.id::text || ':' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_adoption_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_pet public.pets%ROWTYPE;
  v_owner_email TEXT;
  v_owner RECORD;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_pet FROM public.pets WHERE id = NEW.pet_id;
  v_owner_email := v_pet.created_by;

  IF v_owner_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_owner FROM public.notification_profile_by_email(v_owner_email);

  v_payload := jsonb_build_object(
    'adoption_request_id', NEW.id,
    'pet_id', NEW.pet_id,
    'pet_name', v_pet.name,
    'applicant_name', NEW.applicant_name,
    'applicant_email', NEW.applicant_email,
    'message', NEW.message
  );

  PERFORM public.enqueue_notification(
    'adoption.received', 'email', 'adoption.received',
    'adoption.received:email:' || NEW.id::text,
    v_payload, v_owner.user_id, v_owner_email, NULL
  );

  IF v_owner.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_owner.user_id, 'adoption.received', 'adoption.received', v_payload,
      'adoption.received:in_app:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_payout_status()
RETURNS TRIGGER AS $$
DECLARE
  v_host RECORD;
  v_payload JSONB;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_host FROM public.notification_host_contact(NEW.host_id);

  v_payload := jsonb_build_object(
    'payout_id', NEW.id,
    'host_id', NEW.host_id,
    'status', NEW.status,
    'net_amount', NEW.net_amount,
    'currency', NEW.currency
  );

  IF v_host.email IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'payout.status', 'email', 'payout.status',
      'payout.status:email:' || NEW.id::text || ':' || NEW.status,
      v_payload, v_host.user_id, v_host.email, NULL
    );
  END IF;

  IF v_host.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_host.user_id, 'payout.status', 'payout.status', v_payload,
      'payout.status:in_app:' || NEW.id::text || ':' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_escrow_released()
RETURNS TRIGGER AS $$
DECLARE
  v_host RECORD;
  v_booking public.hosting_bookings%ROWTYPE;
  v_payload JSONB;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status IS DISTINCT FROM 'released' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_host FROM public.notification_host_contact(NEW.host_id);
  SELECT * INTO v_booking FROM public.hosting_bookings WHERE id = NEW.booking_id;

  v_payload := jsonb_build_object(
    'escrow_id', NEW.id,
    'booking_id', NEW.booking_id,
    'host_earnings', NEW.host_earnings,
    'currency', NEW.currency,
    'pet_name', v_booking.pet_name
  );

  IF v_host.email IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'escrow.released', 'email', 'escrow.released',
      'escrow.released:email:' || NEW.id::text,
      v_payload, v_host.user_id, v_host.email, NULL
    );
  END IF;

  IF v_host.phone IS NOT NULL THEN
    PERFORM public.enqueue_notification(
      'escrow.released', 'sms', 'escrow.released',
      'escrow.released:sms:' || NEW.id::text,
      v_payload, v_host.user_id, NULL, v_host.phone
    );
  END IF;

  IF v_host.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_host.user_id, 'escrow.released', 'escrow.released', v_payload,
      'escrow.released:in_app:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_enqueue_pet_health_reminders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_row RECORD;
  v_payload JSONB;
BEGIN
  FOR v_row IN
    SELECT
      p.id AS user_id,
      p.email,
      p.phone,
      up.name AS pet_name,
      v.vaccine_name,
      v.next_due_date
    FROM public.vaccinations v
    JOIN public.user_pets up ON up.id = v.pet_id
    JOIN public.profiles p ON lower(p.email) = lower(up.created_by)
    WHERE v.next_due_date IS NOT NULL
      AND v.next_due_date BETWEEN current_date AND current_date + interval '7 days'
  LOOP
    v_payload := jsonb_build_object(
      'pet_name', v_row.pet_name,
      'vaccine_name', v_row.vaccine_name,
      'due_date', v_row.next_due_date,
      'reminder_type', 'vaccination'
    );

    PERFORM public.enqueue_notification(
      'reminder.pet_health', 'email', 'reminder.pet_health',
      'reminder.pet_health:email:' || v_row.user_id::text || ':' || v_row.pet_name || ':' || v_row.vaccine_name || ':' || v_row.next_due_date::text,
      v_payload, v_row.user_id, v_row.email, NULL,
      date_trunc('day', v_row.next_due_date::timestamp) + interval '8 hours'
    );

    PERFORM public.insert_user_notification(
      v_row.user_id, 'reminder.pet_health', 'reminder.pet_health', v_payload,
      'reminder.pet_health:in_app:' || v_row.user_id::text || ':' || v_row.pet_name || ':' || v_row.vaccine_name || ':' || v_row.next_due_date::text
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_notifications_select_own ON user_notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY user_notifications_update_own ON user_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
