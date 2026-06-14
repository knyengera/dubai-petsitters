-- Fix is_conversation_participant to read auth context correctly inside RLS.
-- SECURITY DEFINER + bare auth.jwt() can fail to see the caller's JWT in some
-- Supabase/Postgres evaluation paths; use subselect form and invoker rights.

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
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID) TO authenticated;
