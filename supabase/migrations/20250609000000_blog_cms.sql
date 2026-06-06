-- WordPress-style blog CMS: post metadata, comments, indexes, and RLS

-- Extend blog_posts with CMS fields
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Backfill status from legacy published flag
UPDATE blog_posts
SET
  status = CASE WHEN published = true THEN 'published' ELSE 'draft' END,
  published_at = CASE WHEN published = true THEN created_at ELSE NULL END
WHERE status = 'draft' AND (published = true OR published = false);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blog_posts_status_check'
      AND conrelid = 'public.blog_posts'::regclass
  ) THEN
    ALTER TABLE blog_posts
      ADD CONSTRAINT blog_posts_status_check
      CHECK (status IN ('draft', 'scheduled', 'published', 'trash'));
  END IF;
END $$;

-- Blog comments
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blog_comments_status_check'
      AND conrelid = 'public.blog_comments'::regclass
  ) THEN
    ALTER TABLE blog_comments
      ADD CONSTRAINT blog_comments_status_check
      CHECK (status IN ('pending', 'approved', 'spam', 'trash'));
  END IF;
END $$;

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Indexes for public listing and moderation
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx
  ON blog_posts (status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS blog_posts_featured_idx
  ON blog_posts (featured)
  WHERE featured = true AND status IN ('published', 'scheduled');

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx
  ON blog_posts (slug);

CREATE INDEX IF NOT EXISTS blog_comments_post_id_idx
  ON blog_comments (post_id);

CREATE INDEX IF NOT EXISTS blog_comments_status_idx
  ON blog_comments (status);

CREATE INDEX IF NOT EXISTS blog_comments_post_status_idx
  ON blog_comments (post_id, status);

-- Helper: post is publicly visible
CREATE OR REPLACE FUNCTION public.blog_post_is_public(p blog_posts)
RETURNS BOOLEAN AS $$
  SELECT
    p.status = 'published'
    AND coalesce(p.published_at, p.created_at) <= now()
    OR (
      p.status = 'scheduled'
      AND p.scheduled_at IS NOT NULL
      AND p.scheduled_at <= now()
    );
$$ LANGUAGE sql STABLE;

-- Replace legacy public read policy
DROP POLICY IF EXISTS blog_posts_public_read ON blog_posts;

CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT
  USING (public.blog_post_is_public(blog_posts) OR public.is_admin());

-- Blog comments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blog_comments'
      AND policyname = 'blog_comments_public_insert'
  ) THEN
    CREATE POLICY blog_comments_public_insert ON blog_comments
      FOR INSERT
      WITH CHECK (
        status = 'pending'
        AND auth.role() IN ('anon', 'authenticated')
        AND EXISTS (
          SELECT 1 FROM blog_posts p
          WHERE p.id = post_id
            AND public.blog_post_is_public(p)
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blog_comments'
      AND policyname = 'blog_comments_public_read'
  ) THEN
    CREATE POLICY blog_comments_public_read ON blog_comments
      FOR SELECT
      USING (
        status = 'approved'
        AND EXISTS (
          SELECT 1 FROM blog_posts p
          WHERE p.id = post_id
            AND public.blog_post_is_public(p)
        )
        OR public.is_admin()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blog_comments'
      AND policyname = 'blog_comments_admin_write'
  ) THEN
    CREATE POLICY blog_comments_admin_write ON blog_comments
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
