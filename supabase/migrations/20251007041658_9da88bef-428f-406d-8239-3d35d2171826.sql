-- Create tracks table for artist uploads (separate from competition submissions)
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT,
  duration INTEGER, -- duration in seconds
  audio_url TEXT NOT NULL,
  cover_image TEXT,
  plays INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Tracks are viewable by everyone
CREATE POLICY "Tracks are viewable by everyone"
ON public.tracks FOR SELECT
USING (true);

-- Artists can upload their own tracks
CREATE POLICY "Artists can upload own tracks"
ON public.tracks FOR INSERT
WITH CHECK (auth.uid() = artist_id);

-- Artists can update their own tracks
CREATE POLICY "Artists can update own tracks"
ON public.tracks FOR UPDATE
USING (auth.uid() = artist_id);

-- Artists can delete their own tracks
CREATE POLICY "Artists can delete own tracks"
ON public.tracks FOR DELETE
USING (auth.uid() = artist_id);

-- Add trigger for updated_at
CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add ai_score to submissions table for competition scoring
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS ai_score NUMERIC DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100);

-- Add track_id to submissions to link to tracks table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL;

-- Create paystack_transactions table for payment tracking
CREATE TABLE public.paystack_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES', -- KES, NGN, GHS, ZAR
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  reference TEXT NOT NULL UNIQUE,
  paystack_reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.paystack_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.paystack_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_paystack_transactions_updated_at
BEFORE UPDATE ON public.paystack_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for track audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tracks bucket
CREATE POLICY "Anyone can view tracks"
ON storage.objects FOR SELECT
USING (bucket_id = 'tracks');

CREATE POLICY "Artists can upload tracks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can update own tracks"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tracks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can delete own tracks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for covers bucket
CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);