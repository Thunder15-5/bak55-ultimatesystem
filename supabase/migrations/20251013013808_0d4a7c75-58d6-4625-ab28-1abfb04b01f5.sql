-- Fix security definer views

-- Drop and recreate views with proper security
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.public_artist_profiles CASCADE;

-- Create views without security definer (security invoker by default in modern Postgres)
CREATE VIEW public.public_profiles 
WITH (security_invoker=true) AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  location,
  created_at
FROM public.profiles
WHERE id IN (SELECT id FROM public.profiles WHERE auth.uid() IS NOT NULL OR true);

CREATE VIEW public.public_artist_profiles
WITH (security_invoker=true) AS
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

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;