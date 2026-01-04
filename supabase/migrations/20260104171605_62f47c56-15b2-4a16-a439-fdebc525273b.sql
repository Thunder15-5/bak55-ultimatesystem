-- Phase 1: Onboarding and Gamification tables
-- Add onboarding tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;

-- Phase 2: Featured artists table
CREATE TABLE IF NOT EXISTS public.featured_artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  featured_from timestamp with time zone NOT NULL DEFAULT now(),
  featured_until timestamp with time zone NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.featured_artists ENABLE ROW LEVEL SECURITY;

-- Anyone can view featured artists
CREATE POLICY "Anyone can view featured artists" 
ON public.featured_artists 
FOR SELECT 
USING (true);

-- Only admins can manage featured artists
CREATE POLICY "Admins can manage featured artists" 
ON public.featured_artists 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Phase 4: Gamification tables

-- Daily challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL, -- 'listen', 'follow', 'vote', 'share', 'playlist'
  target_count integer NOT NULL DEFAULT 1,
  reward_amount integer NOT NULL DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  reward_claimed boolean DEFAULT false,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Enable RLS on gamification tables
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" 
ON public.daily_challenges 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage challenges" 
ON public.daily_challenges 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- User challenges policies
CREATE POLICY "Users can view own challenges" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default daily challenges
INSERT INTO public.daily_challenges (title, description, challenge_type, target_count, reward_amount) VALUES
('Music Explorer', 'Listen to 5 different tracks today', 'listen', 5, 10),
('Social Butterfly', 'Follow 2 new artists', 'follow', 2, 15),
('Democracy Hero', 'Vote for 3 tracks in competitions', 'vote', 3, 20),
('Curator', 'Add 3 tracks to a playlist', 'playlist', 3, 10),
('Trendsetter', 'Share a track on social media', 'share', 1, 25)
ON CONFLICT DO NOTHING;

-- Add realtime for activity feeds
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_artists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_challenges;