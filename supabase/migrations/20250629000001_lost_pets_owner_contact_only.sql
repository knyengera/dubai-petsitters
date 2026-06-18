-- Standardize lost pet contact on owner_* fields (matching the public report
-- form) and drop the legacy contact_* columns to avoid a confusing dual scheme.

UPDATE lost_pets
SET
  owner_name = COALESCE(NULLIF(TRIM(owner_name), ''), NULLIF(TRIM(contact_name), '')),
  owner_phone = COALESCE(NULLIF(TRIM(owner_phone), ''), NULLIF(TRIM(contact_phone), '')),
  owner_email = COALESCE(NULLIF(TRIM(owner_email), ''), NULLIF(TRIM(contact_email), ''))
WHERE
  contact_name IS NOT NULL
  OR contact_phone IS NOT NULL
  OR contact_email IS NOT NULL;

ALTER TABLE lost_pets DROP COLUMN IF EXISTS contact_name;
ALTER TABLE lost_pets DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE lost_pets DROP COLUMN IF EXISTS contact_email;
