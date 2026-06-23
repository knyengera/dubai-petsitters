-- Dubai Petsitters — initial schema migrated from Base44 entities
-- Apply with: supabase db push (after linking project)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'host', 'vet')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adoption catalog pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog','cat','bird','rabbit','fish','reptile','other')),
  breed TEXT,
  age TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  size TEXT CHECK (size IN ('small','medium','large')),
  description TEXT,
  image_url TEXT,
  location TEXT,
  vaccinated BOOLEAN DEFAULT false,
  neutered BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','pending','adopted')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pet_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT,
  services TEXT[] DEFAULT '{}',
  accepted_pet_types TEXT[] DEFAULT '{}',
  price_per_night NUMERIC,
  price_per_day NUMERIC,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  response_time TEXT,
  max_pets INTEGER,
  has_yard BOOLEAN DEFAULT false,
  non_smoking BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  languages TEXT[] DEFAULT '{}',
  gallery TEXT[] DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age TEXT,
  gender TEXT,
  weight_kg NUMERIC,
  photo_url TEXT,
  microchip_number TEXT,
  insurance_info TEXT,
  allergies TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  blood_type TEXT,
  color TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vet_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  services TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  opening_hours TEXT,
  emergency_available BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES pet_hosts(id) ON DELETE SET NULL,
  pet_name TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT,
  city TEXT,
  special_instructions TEXT,
  quoted_price NUMERIC,
  platform_fee NUMERIC,
  total_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_name TEXT NOT NULL,
  pet_id UUID REFERENCES user_pets(id) ON DELETE SET NULL,
  clinic_name TEXT,
  vet_name TEXT,
  date DATE,
  time TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_name TEXT,
  owner_email TEXT NOT NULL,
  owner_phone TEXT,
  notes TEXT,
  fee NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  contact_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('host','vet')),
  contact_email TEXT,
  subject TEXT,
  last_message TEXT,
  last_message_date TIMESTAMPTZ,
  owner_unread INTEGER DEFAULT 0,
  contact_unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  upvoted_by TEXT[] DEFAULT '{}',
  comment_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT,
  author_name TEXT,
  published BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lost_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_name TEXT,
  species TEXT,
  breed TEXT,
  description TEXT,
  image_url TEXT,
  last_seen_location TEXT,
  last_seen_date DATE,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'lost',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  record_type TEXT,
  title TEXT,
  description TEXT,
  date DATE,
  vet_name TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  date_given DATE,
  next_due_date DATE,
  vet_name TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adoption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type TEXT NOT NULL,
  gateway TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'pending',
  reference_id TEXT,
  payer_name TEXT,
  payer_email TEXT NOT NULL,
  gateway_transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  partner_name TEXT,
  discount TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS host_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES pet_hosts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  price_override NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(host_id, date)
);

CREATE TABLE IF NOT EXISTS vet_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES vet_clinics(id) ON DELETE CASCADE,
  plan TEXT,
  status TEXT DEFAULT 'pending',
  amount NUMERIC,
  start_date DATE,
  end_date DATE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  author_name TEXT,
  author_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pet_hosts_city ON pet_hosts(city);
CREATE INDEX IF NOT EXISTS idx_pet_hosts_rating ON pet_hosts(rating DESC);
CREATE INDEX IF NOT EXISTS idx_pet_hosts_created_by ON pet_hosts(created_by);
CREATE INDEX IF NOT EXISTS idx_vet_clinics_city ON vet_clinics(city);
CREATE INDEX IF NOT EXISTS idx_hosting_bookings_owner ON hosting_bookings(owner_email);
CREATE INDEX IF NOT EXISTS idx_hosting_bookings_host ON hosting_bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_appointments_owner ON appointments(owner_email);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_email);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_email);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category);
CREATE INDEX IF NOT EXISTS idx_user_pets_created_by ON user_pets(created_by);
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet ON vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet ON medical_records(pet_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Helper: admin check via app_metadata role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Public read policies (catalog content)
CREATE POLICY pets_public_read ON pets FOR SELECT USING (status = 'available' OR public.is_admin());
CREATE POLICY pet_hosts_public_read ON pet_hosts FOR SELECT USING (true);
CREATE POLICY vet_clinics_public_read ON vet_clinics FOR SELECT USING (true);
CREATE POLICY forum_threads_public_read ON forum_threads FOR SELECT USING (true);
CREATE POLICY forum_comments_public_read ON forum_comments FOR SELECT USING (true);
CREATE POLICY blog_posts_public_read ON blog_posts FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY partner_deals_public_read ON partner_deals FOR SELECT USING (is_active = true);
CREATE POLICY lost_pets_public_read ON lost_pets FOR SELECT USING (true);
CREATE POLICY reviews_public_read ON reviews FOR SELECT USING (true);

-- User-owned records
CREATE POLICY user_pets_owner ON user_pets FOR ALL
  USING (created_by = auth.jwt() ->> 'email' OR public.is_admin())
  WITH CHECK (created_by = auth.jwt() ->> 'email' OR public.is_admin());

CREATE POLICY appointments_owner ON appointments FOR ALL
  USING (owner_email = auth.jwt() ->> 'email' OR public.is_admin())
  WITH CHECK (owner_email = auth.jwt() ->> 'email' OR public.is_admin());

CREATE POLICY hosting_bookings_participant ON hosting_bookings FOR ALL
  USING (
    owner_email = auth.jwt() ->> 'email'
    OR public.is_admin()
    OR host_id IN (SELECT id FROM pet_hosts WHERE created_by = auth.jwt() ->> 'email')
  )
  WITH CHECK (owner_email = auth.jwt() ->> 'email' OR public.is_admin());

CREATE POLICY conversations_participant ON conversations FOR ALL
  USING (
    owner_email = auth.jwt() ->> 'email'
    OR contact_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  )
  WITH CHECK (
    owner_email = auth.jwt() ->> 'email'
    OR contact_email = auth.jwt() ->> 'email'
    OR public.is_admin()
  );

CREATE POLICY pet_hosts_owner_write ON pet_hosts FOR INSERT WITH CHECK (true);
CREATE POLICY pet_hosts_owner_update ON pet_hosts FOR UPDATE
  USING (created_by = auth.jwt() ->> 'email' OR public.is_admin());
CREATE POLICY pet_hosts_owner_delete ON pet_hosts FOR DELETE
  USING (created_by = auth.jwt() ->> 'email' OR public.is_admin());

CREATE POLICY profiles_self ON profiles FOR ALL
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Authenticated insert for forum / lost pets
CREATE POLICY forum_threads_auth_insert ON forum_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY forum_threads_author_update ON forum_threads FOR UPDATE
  USING (author_email = auth.jwt() ->> 'email' OR public.is_admin());
CREATE POLICY forum_comments_auth_insert ON forum_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY lost_pets_auth_insert ON lost_pets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY payments_owner ON payments FOR ALL
  USING (payer_email = auth.jwt() ->> 'email' OR public.is_admin())
  WITH CHECK (payer_email = auth.jwt() ->> 'email' OR public.is_admin());

CREATE POLICY vaccinations_owner ON vaccinations FOR ALL
  USING (
    pet_id IN (SELECT id FROM user_pets WHERE created_by = auth.jwt() ->> 'email')
    OR public.is_admin()
  );

CREATE POLICY medical_records_owner ON medical_records FOR ALL
  USING (
    pet_id IN (SELECT id FROM user_pets WHERE created_by = auth.jwt() ->> 'email')
    OR public.is_admin()
  );

CREATE POLICY host_availability_host ON host_availability FOR ALL
  USING (
    host_id IN (SELECT id FROM pet_hosts WHERE created_by = auth.jwt() ->> 'email')
    OR public.is_admin()
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
