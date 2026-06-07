-- Forum platform seed data (boards are created in migration; this adds sample topics/replies)

INSERT INTO forum_topics (
  id,
  board_id,
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
  created_at
) VALUES
  (
    '66666666-6666-4666-8666-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-333333333333',
    'Best time to walk dogs during summer?',
    'best-time-to-walk-dogs-during-summer-66666666',
    'With the hotter weather in Riyadh, what times have worked best for safe dog walks?',
    'Maha',
    'maha@example.com',
    'approved',
    true,
    2,
    7,
    now() - interval '2 hours',
    'Noura',
    'noura@example.com',
    now() - interval '3 days'
  ),
  (
    '66666666-6666-4666-8666-222222222222',
    'aaaaaaaa-aaaa-4aaa-8aaa-555555555555',
    'Cat-friendly boarding recommendations in Jeddah',
    'cat-friendly-boarding-recommendations-in-jeddah-66666666',
    'I am looking for a calm boarding option for a shy indoor cat. What should I ask hosts before booking?',
    'Faisal',
    'faisal@example.com',
    'approved',
    false,
    1,
    4,
    now() - interval '5 hours',
    'Sara',
    'sara@example.com',
    now() - interval '2 days'
  ),
  (
    '66666666-6666-4666-8666-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-666666666666',
    'Preparing an adopted rabbit for a new home',
    'preparing-an-adopted-rabbit-for-a-new-home-66666666',
    'Any tips for litter setup, food, and making the first week less stressful?',
    'Layla',
    'layla@example.com',
    'approved',
    false,
    1,
    5,
    now() - interval '1 day',
    'Hind',
    'hind@example.com',
    now() - interval '4 days'
  ),
  (
    '88888888-8888-4888-8888-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
    'Welcome to the Saudi Petsitters community forum',
    'welcome-to-the-saudi-petsitters-community-forum',
    'Introduce yourself and read our community guidelines before posting.',
    'Admin',
    'admin@example.com',
    'approved',
    true,
    0,
    12,
    now() - interval '1 week',
    'Admin',
    'admin@example.com',
    now() - interval '2 weeks'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  content = EXCLUDED.content,
  moderation_status = EXCLUDED.moderation_status,
  pinned = EXCLUDED.pinned,
  updated_at = now();

INSERT INTO forum_replies (
  id,
  topic_id,
  content,
  author_name,
  author_email,
  moderation_status,
  reaction_count,
  created_at
) VALUES
  (
    '77777777-7777-4777-8777-111111111111',
    '66666666-6666-4666-8666-111111111111',
    'Before 7am has been safest for us. I also check the pavement with my hand before leaving.',
    'Omar',
    'omar@example.com',
    'approved',
    3,
    now() - interval '2 hours'
  ),
  (
    '77777777-7777-4777-8777-222222222222',
    '66666666-6666-4666-8666-111111111111',
    'Cooling mats and shorter routes helped my senior dog a lot.',
    'Noura',
    'noura@example.com',
    'approved',
    2,
    now() - interval '3 hours'
  ),
  (
    '77777777-7777-4777-8777-333333333333',
    '66666666-6666-4666-8666-222222222222',
    'Ask whether cats are kept separately from dogs and whether the host can send daily photos.',
    'Sara',
    'sara@example.com',
    'approved',
    4,
    now() - interval '5 hours'
  ),
  (
    '77777777-7777-4777-8777-444444444444',
    '66666666-6666-4666-8666-333333333333',
    'Give the rabbit a quiet room first and introduce greens gradually.',
    'Hind',
    'hind@example.com',
    'approved',
    2,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  moderation_status = EXCLUDED.moderation_status,
  updated_at = now();

-- Refresh counts after seed
DO $$
DECLARE
  b RECORD;
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM forum_topics LOOP
    PERFORM public.forum_refresh_topic_stats(t.id);
  END LOOP;
  FOR b IN SELECT id FROM forum_boards LOOP
    PERFORM public.forum_refresh_board_counts(b.id);
  END LOOP;
END $$;
