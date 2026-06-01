-- RLS policies missing from initial_schema (applied to remote via Supabase MCP)

CREATE POLICY messages_participant_select ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE owner_email = auth.jwt() ->> 'email'
         OR contact_email = auth.jwt() ->> 'email'
    )
    OR public.is_admin()
  );

CREATE POLICY messages_participant_insert ON messages FOR INSERT
  WITH CHECK (
    sender_email = auth.jwt() ->> 'email'
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE owner_email = auth.jwt() ->> 'email'
         OR contact_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY messages_participant_update ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE owner_email = auth.jwt() ->> 'email'
         OR contact_email = auth.jwt() ->> 'email'
    )
    OR public.is_admin()
  );

CREATE POLICY adoption_requests_public_insert ON adoption_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY adoption_requests_owner_read ON adoption_requests FOR SELECT
  USING (
    applicant_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY vet_subscriptions_owner ON vet_subscriptions FOR ALL
  USING (created_by = auth.jwt() ->> 'email' OR public.is_admin())
  WITH CHECK (created_by = auth.jwt() ->> 'email' OR public.is_admin());

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
