
-- Merch products table
CREATE TABLE public.merch_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'apparel',
  price_min NUMERIC NOT NULL DEFAULT 0,
  price_max NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  images TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_limited BOOLEAN DEFAULT false,
  limited_drop_end TIMESTAMPTZ,
  stock_status TEXT DEFAULT 'in_stock',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Merch cart items
CREATE TABLE public.merch_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.merch_products(id) ON DELETE CASCADE,
  variant JSONB DEFAULT '{}',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Merch orders
CREATE TABLE public.merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  items JSONB NOT NULL DEFAULT '[]',
  shipping_info JSONB DEFAULT '{}',
  payment_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.merch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;

-- Products: public read
CREATE POLICY "Anyone can view merch products" ON public.merch_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage merch products" ON public.merch_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Cart: user owns their cart
CREATE POLICY "Users manage own cart" ON public.merch_cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders: user sees own orders, admins see all
CREATE POLICY "Users view own orders" ON public.merch_orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own orders" ON public.merch_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.merch_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed initial products
INSERT INTO public.merch_products (title, description, category, price_min, price_max, images, sizes, colors, is_featured, sort_order) VALUES
('Born African Royalty Hoodie', 'Premium heavyweight hoodie featuring the iconic Born African Royalty crest. Celebrates African creativity, power, and talent. Made with premium cotton blend for ultimate comfort and durability.', 'apparel', 60, 80, ARRAY['/merch/born-african-royalty-logo.png'], ARRAY['S','M','L','XL','XXL'], ARRAY['Black','Red','Green'], true, 1),
('Born African Royalty T-Shirt', 'Classic fitted tee with the Born African Royalty emblem. Bold statement piece representing African culture and music heritage. 100% premium cotton.', 'apparel', 25, 40, ARRAY['/merch/born-african-royalty-logo.png'], ARRAY['S','M','L','XL','XXL'], ARRAY['Black','White','Red','Green'], true, 2),
('Royal Talent Cap', 'Structured snapback cap with embroidered Born African Royalty logo. Gold thread detailing on black premium fabric. Adjustable fit.', 'accessories', 20, 35, ARRAY['/merch/born-african-royalty-logo.png'], ARRAY['One Size'], ARRAY['Black','Gold'], true, 3),
('Born African Royalty Poster', 'Museum-quality art print featuring the full Born African Royalty crest. Printed on heavyweight matte paper. Perfect for studios, offices, and living spaces.', 'art', 10, 20, ARRAY['/merch/born-african-royalty-logo.png'], ARRAY['A3','A2','A1'], ARRAY['Standard'], false, 4);
