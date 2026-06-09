-- Bypass phone verification for user with email containing "mckuda"
-- Run in Supabase Dashboard → SQL Editor (requires project owner / service access)
--
-- After running: sign out and sign back in so your session picks up the updated auth state.

DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT;
  now_ts TIMESTAMPTZ := now();
  legal_version TEXT := '2026-06-09';
  -- Change this to your real number if you want it stored on the account
  bypass_phone TEXT := '+27621727342';
BEGIN
  SELECT id, email
  INTO target_user_id, target_email
  FROM auth.users
  WHERE email ILIKE '%mckuda%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email containing "mckuda"';
  END IF;

  RAISE NOTICE 'Bypassing phone verification for % (id: %)', target_email, target_user_id;

  -- Supabase Auth: mark phone (and email, if needed) as confirmed
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, now_ts),
    phone = COALESCE(NULLIF(phone, ''), bypass_phone),
    phone_confirmed_at = COALESCE(phone_confirmed_at, now_ts),
    updated_at = now_ts
  WHERE id = target_user_id;

  -- App profile: mark phone verified and onboarding complete
  UPDATE public.profiles
  SET
    phone = COALESCE(NULLIF(phone, ''), bypass_phone),
    phone_verified_at = COALESCE(phone_verified_at, now_ts),
    profile_completed_at = COALESCE(profile_completed_at, now_ts),
    terms_accepted_at = COALESCE(terms_accepted_at, now_ts),
    privacy_accepted_at = COALESCE(privacy_accepted_at, now_ts),
    liability_waiver_accepted_at = COALESCE(liability_waiver_accepted_at, now_ts),
    legal_documents_version = COALESCE(legal_documents_version, legal_version),
    updated_at = now_ts
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile row missing for user %', target_user_id;
  END IF;
END $$;

-- Confirm the result
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_verified,
  u.phone,
  u.phone_confirmed_at IS NOT NULL AS phone_verified_in_auth,
  p.phone_verified_at IS NOT NULL AS phone_verified_in_profile,
  p.profile_completed_at IS NOT NULL AS profile_complete,
  p.full_name,
  p.city,
  p.avatar_url IS NOT NULL AS has_avatar,
  p.id_document_path IS NOT NULL AS has_id_document,
  p.legal_documents_version
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email ILIKE '%mckuda%';
