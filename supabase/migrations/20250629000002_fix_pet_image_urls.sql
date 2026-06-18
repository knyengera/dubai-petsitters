-- Replace removed Unsplash image URLs used by adoption seed/demo pets so the
-- home page and adopt listings show working photos.

UPDATE pets
SET image_url = 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=85', updated_at = now()
WHERE image_url LIKE '%photo-1574158622682%';

UPDATE pets
SET image_url = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=85', updated_at = now()
WHERE image_url LIKE '%photo-1633722715463%';

UPDATE pets
SET image_url = 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800&q=85', updated_at = now()
WHERE image_url LIKE '%photo-1585110396000%';

UPDATE pets
SET image_url = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=85', updated_at = now()
WHERE image_url LIKE '%photo-1572826595617%';
