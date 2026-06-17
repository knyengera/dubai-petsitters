-- Additional gallery photos for partner listings and deals (cover stays in image_url)

ALTER TABLE partner_inquiries
  ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

ALTER TABLE partner_deals
  ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
