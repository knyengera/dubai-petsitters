-- Full forum platform: boards, topics, replies, reactions, reports, subscriptions, bookmarks, read state

-- ---------------------------------------------------------------------------
-- Boards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT 'blue',
  parent_id UUID REFERENCES forum_boards(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  topic_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Topics (enhanced threads)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES forum_boards(id) ON DELETE CASCADE,
  legacy_thread_id UUID UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_avatar_url TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  locked BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  solved BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_author_name TEXT,
  last_reply_author_email TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, slug)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_topics_moderation_status_check'
      AND conrelid = 'public.forum_topics'::regclass
  ) THEN
    ALTER TABLE forum_topics
      ADD CONSTRAINT forum_topics_moderation_status_check
      CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden', 'spam', 'trash'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Replies (enhanced comments, nested)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  legacy_comment_id UUID UNIQUE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_avatar_url TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  reaction_count INTEGER NOT NULL DEFAULT 0,
  is_accepted_answer BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  hidden_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_replies_moderation_status_check'
      AND conrelid = 'public.forum_replies'::regclass
  ) THEN
    ALTER TABLE forum_replies
      ADD CONSTRAINT forum_replies_moderation_status_check
      CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden', 'spam', 'trash'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Reactions (normalized votes/likes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('topic', 'reply')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'upvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id, reaction_type)
);

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('topic', 'reply')),
  target_id UUID NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'misinformation', 'off_topic', 'inappropriate', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Subscriptions, bookmarks, read state, user stats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('board', 'topic')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS forum_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS forum_read_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS forum_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,
  topic_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  accepted_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS forum_boards_display_order_idx ON forum_boards (display_order, title);
CREATE INDEX IF NOT EXISTS forum_topics_board_id_idx ON forum_topics (board_id);
CREATE INDEX IF NOT EXISTS forum_topics_moderation_status_idx ON forum_topics (moderation_status);
CREATE INDEX IF NOT EXISTS forum_topics_board_status_idx ON forum_topics (board_id, moderation_status, pinned DESC, last_reply_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS forum_topics_slug_idx ON forum_topics (slug);
CREATE INDEX IF NOT EXISTS forum_replies_topic_id_idx ON forum_replies (topic_id);
CREATE INDEX IF NOT EXISTS forum_replies_parent_id_idx ON forum_replies (parent_id);
CREATE INDEX IF NOT EXISTS forum_replies_moderation_status_idx ON forum_replies (moderation_status);
CREATE INDEX IF NOT EXISTS forum_reactions_target_idx ON forum_reactions (target_type, target_id);
CREATE INDEX IF NOT EXISTS forum_reports_status_idx ON forum_reports (status);
CREATE INDEX IF NOT EXISTS forum_reports_target_idx ON forum_reports (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forum_topic_is_public(t forum_topics)
RETURNS BOOLEAN AS $$
  SELECT t.moderation_status = 'approved'
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.forum_reply_is_public(r forum_replies)
RETURNS BOOLEAN AS $$
  SELECT r.moderation_status = 'approved'
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.forum_refresh_board_counts(p_board_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_boards b
  SET
    topic_count = (
      SELECT COUNT(*)::INTEGER FROM forum_topics t
      WHERE t.board_id = p_board_id AND t.moderation_status = 'approved'
    ),
    post_count = (
      SELECT COUNT(*)::INTEGER FROM forum_replies r
      JOIN forum_topics t ON t.id = r.topic_id
      WHERE t.board_id = p_board_id AND r.moderation_status = 'approved'
    ) + (
      SELECT COUNT(*)::INTEGER FROM forum_topics t
      WHERE t.board_id = p_board_id AND t.moderation_status = 'approved'
    ),
    updated_at = now()
  WHERE b.id = p_board_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.forum_refresh_topic_stats(p_topic_id UUID)
RETURNS VOID AS $$
DECLARE
  v_board_id UUID;
  v_last_reply RECORD;
BEGIN
  SELECT board_id INTO v_board_id FROM forum_topics WHERE id = p_topic_id;

  SELECT author_name, author_email, created_at
  INTO v_last_reply
  FROM forum_replies
  WHERE topic_id = p_topic_id AND moderation_status = 'approved'
  ORDER BY created_at DESC
  LIMIT 1;

  UPDATE forum_topics t
  SET
    reply_count = (
      SELECT COUNT(*)::INTEGER FROM forum_replies r
      WHERE r.topic_id = p_topic_id AND r.moderation_status = 'approved'
    ),
    reaction_count = (
      SELECT COUNT(*)::INTEGER FROM forum_reactions fr
      WHERE fr.target_type = 'topic' AND fr.target_id = p_topic_id
    ),
    last_reply_at = COALESCE(v_last_reply.created_at, t.created_at),
    last_reply_author_name = COALESCE(v_last_reply.author_name, t.author_name),
    last_reply_author_email = COALESCE(v_last_reply.author_email, t.author_email),
    updated_at = now()
  WHERE t.id = p_topic_id;

  IF v_board_id IS NOT NULL THEN
    PERFORM public.forum_refresh_board_counts(v_board_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.forum_on_reply_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.forum_refresh_topic_stats(OLD.topic_id);
    RETURN OLD;
  END IF;
  PERFORM public.forum_refresh_topic_stats(NEW.topic_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.forum_on_topic_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.forum_refresh_board_counts(OLD.board_id);
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND (OLD.board_id IS DISTINCT FROM NEW.board_id OR OLD.moderation_status IS DISTINCT FROM NEW.moderation_status) THEN
    PERFORM public.forum_refresh_board_counts(OLD.board_id);
  END IF;
  PERFORM public.forum_refresh_board_counts(NEW.board_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_replies_stats_trigger ON forum_replies;
CREATE TRIGGER forum_replies_stats_trigger
  AFTER INSERT OR UPDATE OF moderation_status OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.forum_on_reply_change();

DROP TRIGGER IF EXISTS forum_topics_stats_trigger ON forum_topics;
CREATE TRIGGER forum_topics_stats_trigger
  AFTER INSERT OR UPDATE OF moderation_status, board_id OR DELETE ON forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.forum_on_topic_change();

-- ---------------------------------------------------------------------------
-- Seed default boards
-- ---------------------------------------------------------------------------
INSERT INTO forum_boards (id, title, slug, description, color, display_order) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-111111111111', 'Announcements', 'announcements', 'Official updates and news from Saudi Petsitters.', 'blue', 1),
  ('aaaaaaaa-aaaa-4aaa-8aaa-222222222222', 'Pet Care', 'pet-care', 'General pet care questions and everyday tips.', 'green', 2),
  ('aaaaaaaa-aaaa-4aaa-8aaa-333333333333', 'Health & Wellness', 'health', 'Health, vet visits, vaccinations, and wellness.', 'red', 3),
  ('aaaaaaaa-aaaa-4aaa-8aaa-444444444444', 'Training & Behavior', 'training', 'Training techniques and behavioral advice.', 'indigo', 4),
  ('aaaaaaaa-aaaa-4aaa-8aaa-555555555555', 'Hosting & Boarding', 'hosting', 'Pet hosting, boarding, and sitter experiences.', 'purple', 5),
  ('aaaaaaaa-aaaa-4aaa-8aaa-666666666666', 'Adoption', 'adoption', 'Adoption stories, tips, and questions.', 'pink', 6),
  ('aaaaaaaa-aaaa-4aaa-8aaa-777777777777', 'Lost & Found', 'lost-found', 'Help reuniting lost pets with their families.', 'amber', 7),
  ('aaaaaaaa-aaaa-4aaa-8aaa-888888888888', 'General Discussion', 'general', 'Open conversations about pets and community life.', 'slate', 8)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Backfill legacy forum_threads -> forum_topics
-- ---------------------------------------------------------------------------
INSERT INTO forum_topics (
  id,
  board_id,
  legacy_thread_id,
  title,
  slug,
  content,
  author_name,
  author_email,
  moderation_status,
  pinned,
  reply_count,
  reaction_count,
  last_reply_at,
  last_reply_author_name,
  last_reply_author_email,
  created_at,
  updated_at
)
SELECT
  COALESCE(ft.id, gen_random_uuid()),
  CASE ft.category
    WHEN 'health' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-333333333333'::UUID
    WHEN 'training' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-444444444444'::UUID
    WHEN 'nutrition' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222'::UUID
    WHEN 'lost_found' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-777777777777'::UUID
    WHEN 'hosting' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-555555555555'::UUID
    WHEN 'adoption' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-666666666666'::UUID
    WHEN 'general' THEN 'aaaaaaaa-aaaa-4aaa-8aaa-888888888888'::UUID
    ELSE 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222'::UUID
  END,
  ft.id,
  ft.title,
  lower(regexp_replace(regexp_replace(trim(ft.title), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substr(ft.id::text, 1, 8),
  ft.content,
  ft.author_name,
  ft.author_email,
  'approved',
  COALESCE(ft.pinned, false),
  COALESCE(ft.comment_count, 0),
  COALESCE(ft.upvotes, 0),
  ft.updated_at,
  ft.author_name,
  ft.author_email,
  ft.created_at,
  ft.updated_at
FROM forum_threads ft
WHERE NOT EXISTS (
  SELECT 1 FROM forum_topics t WHERE t.legacy_thread_id = ft.id
);

-- Backfill legacy forum_comments -> forum_replies
INSERT INTO forum_replies (
  id,
  topic_id,
  legacy_comment_id,
  content,
  author_name,
  author_email,
  moderation_status,
  reaction_count,
  created_at,
  updated_at
)
SELECT
  COALESCE(fc.id, gen_random_uuid()),
  t.id,
  fc.id,
  fc.content,
  fc.author_name,
  fc.author_email,
  'approved',
  COALESCE(fc.upvotes, 0),
  fc.created_at,
  fc.created_at
FROM forum_comments fc
JOIN forum_topics t ON t.legacy_thread_id = fc.thread_id
WHERE NOT EXISTS (
  SELECT 1 FROM forum_replies r WHERE r.legacy_comment_id = fc.id
);

-- Refresh board counts after backfill
DO $$
DECLARE
  b RECORD;
BEGIN
  FOR b IN SELECT id FROM forum_boards LOOP
    PERFORM public.forum_refresh_board_counts(b.id);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE forum_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_read_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_user_stats ENABLE ROW LEVEL SECURITY;

-- Boards: public read visible boards
CREATE POLICY forum_boards_public_read ON forum_boards
  FOR SELECT USING (is_visible = true OR public.is_admin());

CREATE POLICY forum_boards_admin_write ON forum_boards
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Topics
CREATE POLICY forum_topics_public_read ON forum_topics
  FOR SELECT USING (
    public.forum_topic_is_public(forum_topics)
    OR author_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY forum_topics_auth_insert ON forum_topics
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND moderation_status = 'pending'
    AND author_email = auth.jwt() ->> 'email'
  );

CREATE POLICY forum_topics_author_update ON forum_topics
  FOR UPDATE USING (
    author_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY forum_topics_admin_delete ON forum_topics
  FOR DELETE USING (public.is_admin() OR author_email = auth.jwt() ->> 'email');

-- Replies
CREATE POLICY forum_replies_public_read ON forum_replies
  FOR SELECT USING (
    public.forum_reply_is_public(forum_replies)
    OR author_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY forum_replies_auth_insert ON forum_replies
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND moderation_status = 'pending'
    AND author_email = auth.jwt() ->> 'email'
  );

CREATE POLICY forum_replies_author_update ON forum_replies
  FOR UPDATE USING (
    author_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY forum_replies_admin_delete ON forum_replies
  FOR DELETE USING (public.is_admin() OR author_email = auth.jwt() ->> 'email');

-- Reactions
CREATE POLICY forum_reactions_public_read ON forum_reactions
  FOR SELECT USING (true);

CREATE POLICY forum_reactions_auth_insert ON forum_reactions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
    AND user_email = auth.jwt() ->> 'email'
  );

CREATE POLICY forum_reactions_owner_delete ON forum_reactions
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Reports
CREATE POLICY forum_reports_auth_insert ON forum_reports
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND reporter_email = auth.jwt() ->> 'email'
  );

CREATE POLICY forum_reports_owner_read ON forum_reports
  FOR SELECT USING (
    reporter_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY forum_reports_admin_write ON forum_reports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Subscriptions
CREATE POLICY forum_subscriptions_owner ON forum_subscriptions
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Bookmarks
CREATE POLICY forum_bookmarks_owner ON forum_bookmarks
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Read state
CREATE POLICY forum_read_state_owner ON forum_read_state
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- User stats
CREATE POLICY forum_user_stats_public_read ON forum_user_stats
  FOR SELECT USING (true);

CREATE POLICY forum_user_stats_admin_write ON forum_user_stats
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Fix reviews authenticated insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reviews'
      AND policyname = 'reviews_auth_insert'
  ) THEN
    CREATE POLICY reviews_auth_insert ON reviews
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND author_email = auth.jwt() ->> 'email'
      );
  END IF;
END $$;
