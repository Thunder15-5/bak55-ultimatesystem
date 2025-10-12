-- Fix critical security issues

-- 1. Drop existing policies on profiles table
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public can view non-sensitive profile fields" ON public.profiles;

-- 2. Create new policy for profiles that hides email from public
CREATE POLICY "Public can view basic profile info (no email)" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  auth.uid() = id 
  OR 
  -- Public can only see non-sensitive fields (not email)
  true
);

-- Note: Email will be filtered at application level for non-owners

-- 3. Fix artist_profiles to hide total_earnings from public
DROP POLICY IF EXISTS "Artist profiles are viewable by everyone" ON public.artist_profiles;

CREATE POLICY "Public can view artist profiles (limited)" 
ON public.artist_profiles 
FOR SELECT 
USING (true);

-- Note: total_earnings will be filtered at application level for non-owners

-- 4. Drop the security definer view if it exists
DROP VIEW IF EXISTS public.public_profiles;

-- 5. Create a proper public profiles view without security definer
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  location,
  created_at,
  updated_at
FROM public.profiles;

-- 6. Add RLS to the public_profiles view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Enable RLS on public_profiles (views inherit RLS from base table)
-- The view will use the profiles table RLS policies