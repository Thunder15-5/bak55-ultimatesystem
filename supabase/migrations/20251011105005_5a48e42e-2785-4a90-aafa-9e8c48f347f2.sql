-- Fix 1: Recreate and fix the handle_new_user trigger
-- First, check if trigger exists and recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _role public.app_role;
BEGIN
  -- Extract role from metadata, default to 'artist'
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'artist');
  
  -- Insert profile
  INSERT INTO public.profiles (id, username, email, bio, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'location'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT DO NOTHING;
  
  -- Create role-specific profile
  IF _role = 'artist' THEN
    INSERT INTO public.artist_profiles (user_id, stage_name, genres)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'stage_name', NEW.raw_user_meta_data->>'username'),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'genres', '[]'::jsonb)))
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF _role = 'brand' THEN
    INSERT INTO public.brand_profiles (user_id, company_name, industry, website, description)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'username'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'website',
      NEW.raw_user_meta_data->>'bio'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix 2: Backfill data for existing users who don't have profiles
-- Create profiles for users missing them
INSERT INTO public.profiles (id, username, email, bio, location)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1)),
  u.email,
  u.raw_user_meta_data->>'bio',
  u.raw_user_meta_data->>'location'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create roles for users missing them
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  COALESCE((u.raw_user_meta_data->>'role')::public.app_role, 'artist')
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create wallets for users missing them
INSERT INTO public.wallets (user_id, balance)
SELECT u.id, 0
FROM auth.users u
LEFT JOIN public.wallets w ON u.id = w.user_id
WHERE w.user_id IS NULL;

-- Create artist profiles for artist users missing them
INSERT INTO public.artist_profiles (user_id, stage_name, genres)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'stage_name', u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1)),
  ARRAY(SELECT jsonb_array_elements_text(COALESCE(u.raw_user_meta_data->'genres', '[]'::jsonb)))
FROM auth.users u
INNER JOIN public.user_roles r ON u.id = r.user_id
LEFT JOIN public.artist_profiles ap ON u.id = ap.user_id
WHERE r.role = 'artist' AND ap.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Fix 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON public.submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_votes_submission_id ON public.votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_comments_track_id ON public.comments(track_id);
CREATE INDEX IF NOT EXISTS idx_followers_artist_id ON public.followers(artist_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);

-- Fix 4: Add tips table for direct artist tipping
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on tips
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Tips policies
CREATE POLICY "Users can view tips they sent"
ON public.tips FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id);

CREATE POLICY "Artists can view tips they received"
ON public.tips FOR SELECT
TO authenticated
USING (auth.uid() = to_artist_id);

CREATE POLICY "Authenticated users can send tips"
ON public.tips FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- Add index for tips
CREATE INDEX IF NOT EXISTS idx_tips_to_artist ON public.tips(to_artist_id);
CREATE INDEX IF NOT EXISTS idx_tips_from_user ON public.tips(from_user_id);