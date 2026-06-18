-- Use image_url as the single photo field for lost pet reports.

UPDATE lost_pets
SET image_url = COALESCE(NULLIF(TRIM(image_url), ''), NULLIF(TRIM(photo_url), ''))
WHERE photo_url IS NOT NULL
  AND (image_url IS NULL OR TRIM(image_url) = '');

ALTER TABLE lost_pets DROP COLUMN IF EXISTS photo_url;
