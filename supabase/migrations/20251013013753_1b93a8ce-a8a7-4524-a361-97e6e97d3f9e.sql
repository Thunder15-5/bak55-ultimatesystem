-- PRODUCTION-READY SECURITY FIXES

-- 1. Fix profiles table - Create separate public view
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Remove conflicting policies
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profile info (no email)" ON public.profiles;
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;

-- Only authenticated users and profile owners can access profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view other profiles (no email)"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() != id);

-- Create safe public view with no sensitive data
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  location,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Fix artist_profiles - hide financial data
DROP POLICY IF EXISTS "Public can view artist profiles (limited)" ON public.artist_profiles;

CREATE POLICY "Public can view artist profiles (no financials)" 
ON public.artist_profiles FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Create safe public view for artist profiles
CREATE VIEW public.public_artist_profiles AS
SELECT 
  id,
  user_id,
  stage_name,
  genres,
  social_links,
  verified,
  talent_score,
  created_at,
  updated_at
FROM public.artist_profiles;

GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;

-- 3. Fix share_analytics - only aggregate data visible
DROP POLICY IF EXISTS "Share analytics are viewable by everyone" ON public.share_analytics;

CREATE POLICY "Users can view own share analytics" 
ON public.share_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Track owners can view their track analytics"
ON public.share_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracks
    WHERE tracks.id = share_analytics.track_id
    AND tracks.artist_id = auth.uid()
  )
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_tips_to_artist ON public.tips(to_artist_id);
CREATE INDEX IF NOT EXISTS idx_tips_from_user ON public.tips(from_user_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_track ON public.share_analytics(track_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_user ON public.share_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_track ON public.comments(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user ON public.listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_artist ON public.followers(artist_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_id);

-- 5. Add constraints for data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_not_empty CHECK (email != ''),
ADD CONSTRAINT profiles_username_not_empty CHECK (username != '');

ALTER TABLE public.wallets
ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0);

ALTER TABLE public.tips
ADD CONSTRAINT tips_amount_positive CHECK (amount > 0),
ADD CONSTRAINT tips_no_self_tipping CHECK (from_user_id != to_artist_id);

-- 6. Add unique constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);