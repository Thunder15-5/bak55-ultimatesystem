
-- 1. Add pricing columns to tracks table
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS is_paid_download boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_kes numeric(10,2) DEFAULT NULL;

-- 2. Create song purchases table
CREATE TABLE public.song_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  artist_id uuid NOT NULL REFERENCES public.profiles(id),
  amount_kes numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_reference text,
  download_count integer NOT NULL DEFAULT 0,
  max_downloads integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create download logs table
CREATE TABLE public.download_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid NOT NULL REFERENCES public.song_purchases(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

-- 4. Create platform sales config table (for adjustable withdrawal fee)
CREATE TABLE public.sales_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL UNIQUE,
  config_value numeric(10,4) NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Insert default withdrawal fee config (5%)
INSERT INTO public.sales_config (config_key, config_value, description)
VALUES ('withdrawal_fee_percent', 5.0, 'Percentage fee deducted during artist withdrawal from song sales earnings');

-- 5. Enable RLS
ALTER TABLE public.song_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_config ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for song_purchases
CREATE POLICY "Buyers can view their own purchases"
  ON public.song_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Artists can view sales of their tracks"
  ON public.song_purchases FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Admins can view all purchases"
  ON public.song_purchases FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert purchases"
  ON public.song_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- 7. RLS Policies for download_logs
CREATE POLICY "Users can view their own downloads"
  ON public.download_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all downloads"
  ON public.download_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own download logs"
  ON public.download_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policies for sales_config
CREATE POLICY "Anyone can read sales config"
  ON public.sales_config FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update sales config"
  ON public.sales_config FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- 9. Indexes for performance
CREATE INDEX idx_song_purchases_track_id ON public.song_purchases(track_id);
CREATE INDEX idx_song_purchases_buyer_id ON public.song_purchases(buyer_id);
CREATE INDEX idx_song_purchases_artist_id ON public.song_purchases(artist_id);
CREATE INDEX idx_download_logs_purchase_id ON public.download_logs(purchase_id);
CREATE INDEX idx_download_logs_track_id ON public.download_logs(track_id);
CREATE INDEX idx_tracks_is_paid ON public.tracks(is_paid_download) WHERE is_paid_download = true;
