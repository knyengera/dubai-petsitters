-- Backfill missing contact_email on host conversations and extend RLS
-- so hosts/vets can access threads via contact_id ownership.

-- ---------------------------------------------------------------------------
-- Backfill host contact_email from pet_hosts.created_by
-- ---------------------------------------------------------------------------

UPDATE public.conversations c
SET contact_email = ph.created_by,
    updated_at = now()
FROM public.pet_hosts ph
WHERE c.contact_type = 'host'
  AND c.contact_email IS NULL
  AND ph.id::text = c.contact_id
  AND ph.created_by IS NOT NULL;

-- Backfill vet contact_email from vet_subscriptions.created_by
UPDATE public.conversations c
SET contact_email = vs.created_by,
    updated_at = now()
FROM public.vet_subscriptions vs
WHERE c.contact_type = 'vet'
  AND c.contact_email IS NULL
  AND vs.clinic_id::text = c.contact_id
  AND vs.created_by IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Participant helper (case-insensitive email + host/vet ownership)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (
        lower(c.owner_email) = lower(auth.jwt() ->> 'email')
        OR lower(c.contact_email) = lower(auth.jwt() ->> 'email')
        OR (
          c.contact_type = 'host'
          AND c.contact_id IN (
            SELECT ph.id::text
            FROM public.pet_hosts ph
            WHERE ph.user_id = auth.uid()
               OR lower(ph.created_by) = lower(auth.jwt() ->> 'email')
          )
        )
        OR (
          c.contact_type = 'vet'
          AND c.contact_id IN (
            SELECT vs.clinic_id::text
            FROM public.vet_subscriptions vs
            WHERE lower(vs.created_by) = lower(auth.jwt() ->> 'email')
          )
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Conversations RLS
-- ---------------------------------------------------------------------------

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
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Messages RLS
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS messages_participant_select ON public.messages;
DROP POLICY IF EXISTS messages_participant_insert ON public.messages;
DROP POLICY IF EXISTS messages_participant_update ON public.messages;

CREATE POLICY messages_participant_select ON public.messages FOR SELECT
  USING (
    public.is_conversation_participant(conversation_id)
    OR public.is_admin()
  );

CREATE POLICY messages_participant_insert ON public.messages FOR INSERT
  WITH CHECK (
    lower(sender_email) = lower(auth.jwt() ->> 'email')
    AND public.is_conversation_participant(conversation_id)
  );

CREATE POLICY messages_participant_update ON public.messages FOR UPDATE
  USING (
    public.is_conversation_participant(conversation_id)
    OR public.is_admin()
  );
