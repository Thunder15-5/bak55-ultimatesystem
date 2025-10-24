-- Create helper function to check if user is NOT a fan
CREATE OR REPLACE FUNCTION public.is_not_fan(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = user_id_param
    AND role = 'fan'
  ) OR EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = user_id_param
    AND role IN ('artist', 'brand', 'admin')
  );
$$;

-- Drop existing INSERT policies for track_likes, comments, and followers
DROP POLICY IF EXISTS "Users can like tracks" ON public.track_likes;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can follow artists" ON public.followers;

-- Recreate policies with fan restrictions
CREATE POLICY "Non-fans can like tracks"
ON public.track_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_not_fan(auth.uid()));

CREATE POLICY "Non-fans can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_not_fan(auth.uid()));

CREATE POLICY "Non-fans can follow artists"
ON public.followers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id AND public.is_not_fan(auth.uid()));