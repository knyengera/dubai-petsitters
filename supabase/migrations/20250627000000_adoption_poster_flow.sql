-- Adoption poster flow: richer application fields, user-submitted listings,
-- adoption messaging threads, and poster/applicant notifications.

-- ---------------------------------------------------------------------------
-- 1. Adoption request application fields (align with AdoptionModal)
-- ---------------------------------------------------------------------------

ALTER TABLE public.adoption_requests
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS housing_type TEXT,
  ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS experience TEXT;

-- ---------------------------------------------------------------------------
-- 2. User-submitted adoption listings
--    Authenticated users may list their own pets; admins approve them by
--    moving status from 'pending_review' to 'available'.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pets_created_by ON public.pets (created_by);

-- Force non-admin listings into review and prevent self-approval.
CREATE OR REPLACE FUNCTION public.pets_enforce_owner_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only constrain authenticated end users; admins, service role, and seed
  -- scripts (no auth.uid()) keep the values they provide.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending_review';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'available' AND OLD.status IS DISTINCT FROM 'available' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_pets_enforce_owner_status ON public.pets;
CREATE TRIGGER trg_pets_enforce_owner_status
  BEFORE INSERT OR UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.pets_enforce_owner_status();

-- Owners can see their own listings regardless of status (public read of
-- available pets and admin read already exist via pets_public_read).
DROP POLICY IF EXISTS pets_owner_read ON public.pets;
CREATE POLICY pets_owner_read ON public.pets FOR SELECT
  USING (lower(created_by) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS pets_owner_insert ON public.pets;
CREATE POLICY pets_owner_insert ON public.pets FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND lower(created_by) = lower(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS pets_owner_update ON public.pets;
CREATE POLICY pets_owner_update ON public.pets FOR UPDATE
  USING (lower(created_by) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(created_by) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS pets_owner_delete ON public.pets;
CREATE POLICY pets_owner_delete ON public.pets FOR DELETE
  USING (lower(created_by) = lower(auth.jwt() ->> 'email'));

-- Posters can read adoption requests for pets they listed (applicant and admin
-- read already exist via adoption_requests_owner_read).
DROP POLICY IF EXISTS adoption_requests_poster_read ON public.adoption_requests;
CREATE POLICY adoption_requests_poster_read ON public.adoption_requests FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM public.pets
      WHERE lower(created_by) = lower(auth.jwt() ->> 'email')
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Adoption messaging threads
--    A conversation with contact_type = 'adoption' uses the adoption request
--    id as contact_id so each application gets its own thread.
-- ---------------------------------------------------------------------------

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_contact_type_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_contact_type_check
  CHECK (contact_type IN ('host', 'vet', 'adoption'));

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (
        lower(c.owner_email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
        OR lower(c.contact_email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
        OR (
          c.contact_type = 'host'
          AND c.contact_id IN (
            SELECT ph.id::text
            FROM public.pet_hosts ph
            WHERE ph.user_id = (SELECT auth.uid())
               OR lower(ph.created_by) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
          )
        )
        OR (
          c.contact_type = 'vet'
          AND c.contact_id IN (
            SELECT vs.clinic_id::text
            FROM public.vet_subscriptions vs
            WHERE lower(vs.created_by) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
          )
        )
        OR (
          c.contact_type = 'adoption'
          AND c.contact_id IN (
            SELECT ar.id::text
            FROM public.adoption_requests ar
            JOIN public.pets pt ON pt.id = ar.pet_id
            WHERE lower(pt.created_by) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
               OR lower(ar.applicant_email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
          )
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID) TO authenticated;

DROP POLICY IF EXISTS conversations_participant ON public.conversations;
CREATE POLICY conversations_participant ON public.conversations FOR ALL
  USING (
    lower(owner_email) = lower(auth.jwt() ->> 'email')
    OR lower(contact_email) = lower(auth.jwt() ->> 'email')
    OR (
      contact_type = 'host'
      AND contact_id IN (
        SELECT ph.id::text
        FROM public.pet_hosts ph
        WHERE ph.user_id = auth.uid()
           OR lower(ph.created_by) = lower(auth.jwt() ->> 'email')
      )
    )
    OR (
      contact_type = 'vet'
      AND contact_id IN (
        SELECT vs.clinic_id::text
        FROM public.vet_subscriptions vs
        WHERE lower(vs.created_by) = lower(auth.jwt() ->> 'email')
      )
    )
    OR (
      contact_type = 'adoption'
      AND contact_id IN (
        SELECT ar.id::text
        FROM public.adoption_requests ar
        JOIN public.pets pt ON pt.id = ar.pet_id
        WHERE lower(pt.created_by) = lower(auth.jwt() ->> 'email')
           OR lower(ar.applicant_email) = lower(auth.jwt() ->> 'email')
      )
    )
    OR public.is_admin()
  )
  WITH CHECK (
    lower(owner_email) = lower(auth.jwt() ->> 'email')
    OR lower(contact_email) = lower(auth.jwt() ->> 'email')
    OR (
      contact_type = 'host'
      AND contact_id IN (
        SELECT ph.id::text
        FROM public.pet_hosts ph
        WHERE ph.user_id = auth.uid()
           OR lower(ph.created_by) = lower(auth.jwt() ->> 'email')
      )
    )
    OR (
      contact_type = 'vet'
      AND contact_id IN (
        SELECT vs.clinic_id::text
        FROM public.vet_subscriptions vs
        WHERE lower(vs.created_by) = lower(auth.jwt() ->> 'email')
      )
    )
    OR (
      contact_type = 'adoption'
      AND contact_id IN (
        SELECT ar.id::text
        FROM public.adoption_requests ar
        JOIN public.pets pt ON pt.id = ar.pet_id
        WHERE lower(pt.created_by) = lower(auth.jwt() ->> 'email')
           OR lower(ar.applicant_email) = lower(auth.jwt() ->> 'email')
      )
    )
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 4. Notifications: notify poster on new request, confirm to applicant,
--    and notify applicant on approve/reject.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_on_adoption_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_pet public.pets%ROWTYPE;
  v_owner_email TEXT;
  v_owner RECORD;
  v_applicant RECORD;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_pet FROM public.pets WHERE id = NEW.pet_id;
  v_owner_email := v_pet.created_by;

  v_payload := jsonb_build_object(
    'adoption_request_id', NEW.id,
    'pet_id', NEW.pet_id,
    'pet_name', v_pet.name,
    'applicant_name', NEW.applicant_name,
    'applicant_email', NEW.applicant_email,
    'message', NEW.message
  );

  -- Notify the poster (pet lister) of the new request.
  IF v_owner_email IS NOT NULL THEN
    SELECT * INTO v_owner FROM public.notification_profile_by_email(v_owner_email);

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
  END IF;

  -- Confirmation to the applicant.
  IF NEW.applicant_email IS NOT NULL THEN
    SELECT * INTO v_applicant FROM public.notification_profile_by_email(NEW.applicant_email);

    PERFORM public.enqueue_notification(
      'adoption.submitted', 'email', 'adoption.submitted',
      'adoption.submitted:email:' || NEW.id::text,
      v_payload, v_applicant.user_id, NEW.applicant_email, NULL
    );

    IF v_applicant.user_id IS NOT NULL THEN
      PERFORM public.insert_user_notification(
        v_applicant.user_id, 'adoption.submitted', 'adoption.submitted', v_payload,
        'adoption.submitted:in_app:' || NEW.id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notification_on_adoption_status()
RETURNS TRIGGER AS $$
DECLARE
  v_pet public.pets%ROWTYPE;
  v_applicant RECORD;
  v_event TEXT;
  v_payload JSONB;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  IF NEW.applicant_email IS NULL THEN
    RETURN NEW;
  END IF;

  v_event := 'adoption.' || NEW.status;
  SELECT * INTO v_pet FROM public.pets WHERE id = NEW.pet_id;
  SELECT * INTO v_applicant FROM public.notification_profile_by_email(NEW.applicant_email);

  v_payload := jsonb_build_object(
    'adoption_request_id', NEW.id,
    'pet_id', NEW.pet_id,
    'pet_name', v_pet.name,
    'applicant_name', NEW.applicant_name,
    'applicant_email', NEW.applicant_email,
    'status', NEW.status
  );

  PERFORM public.enqueue_notification(
    v_event, 'email', v_event,
    v_event || ':email:' || NEW.id::text,
    v_payload, v_applicant.user_id, NEW.applicant_email, NULL
  );

  IF v_applicant.user_id IS NOT NULL THEN
    PERFORM public.insert_user_notification(
      v_applicant.user_id, v_event, v_event, v_payload,
      v_event || ':in_app:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notification_adoption_status ON public.adoption_requests;
CREATE TRIGGER trg_notification_adoption_status
  AFTER UPDATE OF status ON public.adoption_requests
  FOR EACH ROW EXECUTE FUNCTION public.notification_on_adoption_status();
