-- Replace a removed Unsplash host portrait so the home page host cards show a photo.

UPDATE pet_hosts
SET photo_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', updated_at = now()
WHERE photo_url LIKE '%photo-1488426862026%';
