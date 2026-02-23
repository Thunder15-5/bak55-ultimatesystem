-- Fix overly permissive RLS on artist_earned_badges
-- Drop the old permissive INSERT policy
DROP POLICY IF EXISTS "System can award badges" ON public.artist_earned_badges;

-- Create a proper INSERT policy: only admins can award badges
CREATE POLICY "Only admins can award badges"
ON public.artist_earned_badges
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));