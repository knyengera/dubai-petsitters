-- Structured per-type business details for /partners form

ALTER TABLE partner_inquiries
  ADD COLUMN IF NOT EXISTS business_details JSONB NOT NULL DEFAULT '{}';
