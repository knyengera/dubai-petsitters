-- Extend vet_clinics into a generic partner-business listings table:
-- gallery photos, business type label, and per-type structured details.

ALTER TABLE vet_clinics
  ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'Vet Clinics',
  ADD COLUMN IF NOT EXISTS business_details JSONB NOT NULL DEFAULT '{}';

UPDATE vet_clinics
SET business_type = 'Vet Clinics'
WHERE business_type IS NULL OR business_type = '';

CREATE INDEX IF NOT EXISTS idx_vet_clinics_business_type ON vet_clinics(business_type);
