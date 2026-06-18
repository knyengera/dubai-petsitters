-- Replace removed Unsplash image URLs used by lost pet seed/demo data.

UPDATE lost_pets
SET
  image_url = 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=85',
  photo_url = 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=85',
  updated_at = now()
WHERE
  image_url LIKE '%photo-1513360371669%'
  OR photo_url LIKE '%photo-1513360371669%';

UPDATE lost_pets
SET
  image_url = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=85',
  photo_url = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=85',
  updated_at = now()
WHERE
  image_url LIKE '%photo-1534227572793%'
  OR photo_url LIKE '%photo-1534227572793%';
