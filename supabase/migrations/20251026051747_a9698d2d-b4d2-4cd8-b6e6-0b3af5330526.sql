-- Phase 1: Revert Fan Restrictions - Allow fans full engagement

-- Allow fans to like tracks
DROP POLICY IF EXISTS "Non-fans can like tracks" ON public.track_likes;
DROP POLICY IF EXISTS "Fans cannot like tracks" ON public.track_likes;
DROP POLICY IF EXISTS "Authenticated users can like tracks" ON public.track_likes;
CREATE POLICY "Authenticated users can like tracks" ON public.track_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow fans to comment
DROP POLICY IF EXISTS "Non-fans can create comments" ON public.comments;
DROP POLICY IF EXISTS "Fans cannot create comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow fans to follow artists
DROP POLICY IF EXISTS "Non-fans can follow artists" ON public.followers;
DROP POLICY IF EXISTS "Fans cannot follow artists" ON public.followers;
DROP POLICY IF EXISTS "Authenticated users can follow artists" ON public.followers;
CREATE POLICY "Authenticated users can follow artists" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);