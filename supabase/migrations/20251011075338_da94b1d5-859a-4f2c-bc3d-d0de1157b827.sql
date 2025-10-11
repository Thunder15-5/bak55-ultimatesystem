-- Add banned status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Add AI scoring fields to submissions
ALTER TABLE public.submissions 
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for banned users
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(banned) WHERE banned = true;

-- Create index for AI-analyzed submissions
CREATE INDEX IF NOT EXISTS idx_submissions_ai_analyzed ON public.submissions(ai_analyzed_at) WHERE ai_analyzed_at IS NOT NULL;