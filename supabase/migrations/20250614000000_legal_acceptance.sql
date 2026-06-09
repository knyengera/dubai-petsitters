-- Legal document acceptance tracking on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS liability_waiver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_documents_version TEXT;

-- Copy legal acceptance from signup metadata when present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  accepted_at TIMESTAMPTZ;
  legal_version TEXT;
BEGIN
  accepted_at := NULL;
  legal_version := NULL;

  IF NEW.raw_user_meta_data ? 'legal_accepted_at' THEN
    accepted_at := (NEW.raw_user_meta_data ->> 'legal_accepted_at')::timestamptz;
    legal_version := NEW.raw_user_meta_data ->> 'legal_documents_version';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    terms_accepted_at,
    privacy_accepted_at,
    liability_waiver_accepted_at,
    legal_documents_version
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    accepted_at,
    accepted_at,
    accepted_at,
    legal_version
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
