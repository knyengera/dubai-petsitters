-- Public uploads bucket for pets, hosts, vets, blog, lost pets, partner deals
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-uploads',
  'public-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY public_uploads_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public-uploads');

-- Authenticated users upload to own folder
CREATE POLICY public_uploads_user_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'public-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY public_uploads_user_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'public-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY public_uploads_user_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'public-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
