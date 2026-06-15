-- Business photo for partner advertising listings (shown like vet clinic gallery hero)

ALTER TABLE partner_inquiries
  ADD COLUMN IF NOT EXISTS image_url TEXT;
