-- Fix Security Definer View issue
-- Drop views that bypass RLS policies

DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.public_artist_profiles CASCADE;

-- Note: Frontend should query profiles table directly
-- RLS policies now properly restrict access:
-- - Users see their own complete profile (including email)
-- - Admins see all profiles  
-- - Others only see limited public info (no email)