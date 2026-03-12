-- Update hoodie images
UPDATE merch_products SET images = ARRAY['/merch/hoodies-collection.png'] WHERE id = 'a8884106-3a9f-4c7b-ac6b-72cfd6f9aead';

-- Update t-shirt images
UPDATE merch_products SET images = ARRAY['/merch/tshirts-collection.png'] WHERE id = '6b50d1d9-8916-49d5-8068-84553d9a5a76';

-- Update cap images and colors
UPDATE merch_products SET images = ARRAY['/merch/caps-collection.png'], colors = ARRAY['Black', 'Red', 'Green'] WHERE id = '90c3b372-436a-41f8-93a4-b97b9a31c9c3';

-- Update poster images
UPDATE merch_products SET images = ARRAY['/merch/poster-artwork.png'] WHERE id = 'f63fb9fb-2901-4ff2-8a96-1d77bbb27cc1';

-- Add phone case product
INSERT INTO merch_products (title, description, category, price_min, price_max, images, sizes, colors, is_featured, is_limited, sort_order)
VALUES (
  'Born African Royalty Phone Case',
  'Protect your phone with African pride. Premium hard-shell phone case featuring the iconic Born African Royalty crest. Slim profile, impact-resistant, and vibrant print that won''t fade.',
  'accessories',
  15,
  30,
  ARRAY['/merch/phone-cases-collection.png'],
  ARRAY['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'],
  ARRAY['Black', 'Red', 'Green'],
  false,
  true,
  5
);

-- Add BAKCoin pricing columns
ALTER TABLE merch_products ADD COLUMN IF NOT EXISTS price_bak_min numeric DEFAULT 0;
ALTER TABLE merch_products ADD COLUMN IF NOT EXISTS price_bak_max numeric DEFAULT 0;

-- Set BAKCoin prices (1 BAK = $0.16)
UPDATE merch_products SET price_bak_min = ROUND(price_min / 0.16), price_bak_max = ROUND(price_max / 0.16);

-- Add payment tracking to orders
ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pending';
ALTER TABLE merch_orders ADD COLUMN IF NOT EXISTS total_bak numeric DEFAULT 0;