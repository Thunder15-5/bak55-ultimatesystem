-- Migration: Fix email exposure in profiles table
-- This addresses the critical security vulnerability where authenticated users
-- could view email addresses of other users due to a permissive RLS policy

-- Step 1: Remove the problematic policy that exposes emails to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view other profiles (no email)" ON public.profiles;

-- Step 2: Drop and recreate the secure public_profiles view
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  location,
  created_at,
  updated_at
FROM public.profiles;

-- Step 3: Grant appropriate access to the public view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Step 4: Add documentation
COMMENT ON VIEW public.public_profiles IS 
'Public view of profiles table that excludes sensitive data like email addresses. 
Users can still access their own complete profile (including email) via the profiles table directly using RLS policies.
Admins can access all profile data via the profiles table.';

-- Existing policies remain intact:
-- ✅ "Users can view own profile" - allows users to see their own email
-- ✅ "Admins can update profiles" - allows admins to see all emails
-- ✅ "Users can update own profile" - allows users to update their profile