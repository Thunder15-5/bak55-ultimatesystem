
-- Add inventory tracking and artist ownership to merch_products
ALTER TABLE public.merch_products 
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT -1,
  ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS total_sold integer DEFAULT 0;

-- Add refund and delivery tracking to merch_orders
ALTER TABLE public.merch_orders
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS refund_status text,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON public.merch_orders(status);
CREATE INDEX IF NOT EXISTS idx_merch_orders_created ON public.merch_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merch_products_artist ON public.merch_products(artist_id);
CREATE INDEX IF NOT EXISTS idx_merch_products_active ON public.merch_products(is_active);

-- Trigger to auto-update inventory after order placement
CREATE OR REPLACE FUNCTION public.update_merch_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  prod_stock integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      SELECT stock_quantity INTO prod_stock
      FROM merch_products
      WHERE id = (item->>'product_id')::uuid;
      
      IF prod_stock >= 0 THEN
        UPDATE merch_products 
        SET stock_quantity = GREATEST(0, stock_quantity - COALESCE((item->>'quantity')::integer, 1)),
            total_sold = total_sold + COALESCE((item->>'quantity')::integer, 1),
            stock_status = CASE 
              WHEN stock_quantity - COALESCE((item->>'quantity')::integer, 1) <= 0 THEN 'out_of_stock'
              WHEN stock_quantity - COALESCE((item->>'quantity')::integer, 1) <= low_stock_threshold THEN 'low_stock'
              ELSE 'in_stock'
            END,
            updated_at = now()
        WHERE id = (item->>'product_id')::uuid;
      ELSE
        UPDATE merch_products 
        SET total_sold = total_sold + COALESCE((item->>'quantity')::integer, 1),
            updated_at = now()
        WHERE id = (item->>'product_id')::uuid;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_merch_inventory ON public.merch_orders;
CREATE TRIGGER trg_update_merch_inventory
  AFTER INSERT ON public.merch_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_merch_inventory();

-- Notify admin on new merch order
CREATE OR REPLACE FUNCTION public.notify_admin_merch_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id UUID;
  buyer_username TEXT;
BEGIN
  SELECT username INTO buyer_username FROM profiles WHERE id = NEW.user_id;
  
  FOR admin_id IN SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      admin_id,
      'merch_order',
      '🛍️ New Merch Order',
      buyer_username || ' placed an order worth $' || NEW.total::text,
      '/admin',
      'normal',
      'merch'
    );
  END LOOP;
  
  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    NEW.user_id,
    'merch_order',
    'merch',
    'New merch order: $' || NEW.total::text || ' by ' || buyer_username,
    jsonb_build_object('order_id', NEW.id, 'total', NEW.total, 'payment_method', NEW.payment_method)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_merch_order ON public.merch_orders;
CREATE TRIGGER trg_notify_admin_merch_order
  AFTER INSERT ON public.merch_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_merch_order();

-- Enable realtime for merch_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.merch_orders;
