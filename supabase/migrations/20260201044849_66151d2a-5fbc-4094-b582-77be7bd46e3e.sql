-- Drop existing SELECT policy that allows all tracks to be viewed
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON public.tracks;

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create new SELECT policy: 
-- 1. Approved tracks are visible to everyone
-- 2. Pending/rejected tracks are only visible to the artist who owns them OR admins
CREATE POLICY "Tracks visibility based on moderation status" 
ON public.tracks FOR SELECT
USING (
  moderation_status = 'approved' 
  OR artist_id = auth.uid()
  OR public.is_admin(auth.uid())
);