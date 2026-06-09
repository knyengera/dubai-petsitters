-- Notification system: preferences, outbox queue, enqueue helper, and event triggers

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  booking_email BOOLEAN NOT NULL DEFAULT true,
  booking_sms BOOLEAN NOT NULL DEFAULT true,
  payment_email BOOLEAN NOT NULL DEFAULT true,
  payment_sms BOOLEAN NOT NULL DEFAULT true,
  message_email BOOLEAN NOT NULL DEFAULT true,
  message_sms BOOLEAN NOT NULL DEFAULT false,
  appointment_email BOOLEAN NOT NULL DEFAULT true,
  appointment_sms BOOLEAN NOT NULL DEFAULT true,
  reminder_email BOOLEAN NOT NULL DEFAULT true,
  reminder_sms BOOLEAN NOT NULL DEFAULT false,
  marketing_email BOOLEAN NOT NULL DEFAULT false,
  marketing_sms BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  template_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  provider_ref TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
  ON notification_outbox (scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_recipient
  ON notification_outbox (recipient_user_id);

-- ---------------------------------------------------------------------------
-- Default preferences for new users
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_create_notification_prefs ON public.profiles;
CREATE TRIGGER on_profile_create_notification_prefs
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notification_create_default_preferences();

-- Backfill preferences for existing profiles
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Enqueue helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_event_type TEXT,
  p_channel TEXT,
  p_template_key TEXT,
  p_idempotency_key TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_recipient_user_id UUID DEFAULT NULL,
  p_recipient_email TEXT DEFAULT NULL,
  p_recipient_phone TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_channel NOT IN ('email', 'sms') THEN
    RAISE EXCEPTION 'Invalid notification channel: %', p_channel;
  END IF;

  IF p_channel = 'email' AND coalesce(trim(p_recipient_email), '') = '' THEN
    RETURN NULL;
  END IF;

  IF p_channel = 'sms' AND coalesce(trim(p_recipient_phone), '') = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notification_outbox (
    event_type, channel, template_key, idempotency_key, payload,
    recipient_user_id, recipient_email, recipient_phone, scheduled_for
  ) VALUES (
    p_event_type, p_channel, p_template_key, p_idempotency_key, coalesce(p_payload, '{}'::jsonb),
    p_recipient_user_id, nullif(trim(p_recipient_email), ''), nullif(trim(p_recipient_phone), ''),
    coalesce(p_scheduled_for, now())
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_notification(
  TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(
  TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT, TEXT, TIMESTAMPTZ
) TO service_role;

-- ---------------------------------------------------------------------------
-- Profile lookup helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_profile_by_email(p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  phone TEXT,
  full_name TEXT
) AS $$
  SELECT p.id, p.email, p.phone, p.full_name
  FROM public.profiles p
  WHERE lower(p.email) = lower(p_email)
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_host_contact(p_host_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  phone TEXT,
  full_name TEXT
) AS $$
  SELECT
    ph.user_id,
    coalesce(p.email, ph.created_by),
    p.phone,
    coalesce(p.full_name, ph.full_name)
  FROM public.pet_hosts ph
  LEFT JOIN public.profiles p ON p.id = ph.user_id
     OR (ph.user_id IS NULL AND lower(p.email) = lower(ph.created_by))
  WHERE ph.id = p_host_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Booking notifications
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

  -- Notify owner
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

  -- Notify host
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_booking_insert ON public.hosting_bookings;
CREATE TRIGGER trg_notification_booking_insert
  AFTER INSERT ON public.hosting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_booking_insert();

DROP TRIGGER IF EXISTS trg_notification_booking_confirmed ON public.hosting_bookings;
CREATE TRIGGER trg_notification_booking_confirmed
  AFTER UPDATE OF status ON public.hosting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_booking_confirmed();

-- ---------------------------------------------------------------------------
-- Payment notifications
-- ---------------------------------------------------------------------------

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_payment_captured ON public.payments;
CREATE TRIGGER trg_notification_payment_captured
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_payment_captured();

-- ---------------------------------------------------------------------------
-- Message notifications (debounced 3 minutes)
-- ---------------------------------------------------------------------------

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_message_insert ON public.messages;
CREATE TRIGGER trg_notification_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_message_insert();

-- ---------------------------------------------------------------------------
-- Appointment notifications
-- ---------------------------------------------------------------------------

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_appointment_insert ON public.appointments;
CREATE TRIGGER trg_notification_appointment_insert
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_appointment_insert();

DROP TRIGGER IF EXISTS trg_notification_appointment_status ON public.appointments;
CREATE TRIGGER trg_notification_appointment_status
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_appointment_status();

-- ---------------------------------------------------------------------------
-- Adoption notifications
-- ---------------------------------------------------------------------------

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_adoption_insert ON public.adoption_requests;
CREATE TRIGGER trg_notification_adoption_insert
  AFTER INSERT ON public.adoption_requests
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_adoption_insert();

-- ---------------------------------------------------------------------------
-- Payout notifications
-- ---------------------------------------------------------------------------

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_payout_status ON public.host_payout_requests;
CREATE TRIGGER trg_notification_payout_status
  AFTER UPDATE OF status ON public.host_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_payout_status();

-- ---------------------------------------------------------------------------
-- Escrow released notifications
-- ---------------------------------------------------------------------------

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_escrow_released ON public.escrow_accounts;
CREATE TRIGGER trg_notification_escrow_released
  AFTER UPDATE OF status ON public.escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_escrow_released();

-- ---------------------------------------------------------------------------
-- Pet health reminder enqueue (called by cron)
-- ---------------------------------------------------------------------------

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
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.notification_enqueue_pet_health_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notification_enqueue_pet_health_reminders() TO service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_self ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Outbox: no client access (service role only via dispatcher)
CREATE POLICY notification_outbox_admin_read ON notification_outbox
  FOR SELECT USING (public.is_admin());
