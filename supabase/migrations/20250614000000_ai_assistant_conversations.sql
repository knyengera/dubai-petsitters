-- AI Pet Care Assistant conversation persistence

CREATE TABLE IF NOT EXISTS public.ai_assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  topic TEXT CHECK (topic IS NULL OR topic IN ('feeding', 'travel', 'heat_safety', 'basic_care', 'health', 'general')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_user_updated
  ON public.ai_assistant_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_conversation_created
  ON public.ai_assistant_messages(conversation_id, created_at ASC);

ALTER TABLE public.ai_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_assistant_conversations_owner ON public.ai_assistant_conversations
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY ai_assistant_messages_owner_select ON public.ai_assistant_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_assistant_conversations WHERE user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY ai_assistant_messages_owner_insert ON public.ai_assistant_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_assistant_conversations WHERE user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY ai_assistant_messages_owner_delete ON public.ai_assistant_messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_assistant_conversations WHERE user_id = auth.uid()
    )
    OR public.is_admin()
  );
