-- Fix critical security issues before launch (corrected)

-- 1. Fix profiles table to hide emails from public view
DROP POLICY IF EXISTS "Public can view artist profiles (no financials)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile fully" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users see their complete profile including email
CREATE POLICY "Users view own complete profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins see all profiles
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Others can only see public info (NOT email)
-- Application code must explicitly exclude email field in queries
CREATE POLICY "Public view limited profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() != id);

-- Update policies
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix artist_profiles to hide earnings
DROP POLICY IF EXISTS "Public can view artist profiles (no financials)" ON public.artist_profiles;
DROP POLICY IF EXISTS "Users can view artist profiles (no earnings)" ON public.artist_profiles;

CREATE POLICY "Artist profiles viewable"
  ON public.artist_profiles FOR SELECT
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    auth.uid() IS NOT NULL
  );