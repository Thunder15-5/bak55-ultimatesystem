
-- AI Track Analyses table: stores all AI module results per track
CREATE TABLE public.ai_track_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'talent_scout', 'discovery', 'predictive', 'content_enhance'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Talent Scout scores
  talent_score NUMERIC,
  commercial_readiness NUMERIC,
  breakout_probability NUMERIC,
  vocal_strength NUMERIC,
  production_quality NUMERIC,
  emotional_tone TEXT,
  
  -- Discovery Engine
  target_countries JSONB DEFAULT '[]'::jsonb,
  listener_persona JSONB DEFAULT '{}'::jsonb,
  platform_strategy JSONB DEFAULT '[]'::jsonb,
  fan_growth_prediction JSONB DEFAULT '{}'::jsonb,
  genre_crossovers JSONB DEFAULT '[]'::jsonb,
  
  -- Predictive Analytics
  trend_alignment_score NUMERIC,
  emerging_genre TEXT,
  market_hotspots JSONB DEFAULT '[]'::jsonb,
  release_window JSONB DEFAULT '{}'::jsonb,
  
  -- Content Enhancement
  promo_captions JSONB DEFAULT '[]'::jsonb,
  campaign_ideas JSONB DEFAULT '[]'::jsonb,
  cover_art_concepts JSONB DEFAULT '[]'::jsonb,
  visualizer_concepts JSONB DEFAULT '[]'::jsonb,
  
  -- Full AI response
  raw_analysis JSONB DEFAULT '{}'::jsonb,
  comparable_artists JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_ai_track_analyses_user ON public.ai_track_analyses(user_id);
CREATE INDEX idx_ai_track_analyses_track ON public.ai_track_analyses(track_id);
CREATE INDEX idx_ai_track_analyses_type ON public.ai_track_analyses(analysis_type);

-- RLS
ALTER TABLE public.ai_track_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.ai_track_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON public.ai_track_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update analyses"
  ON public.ai_track_analyses FOR UPDATE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can view all analyses"
  ON public.ai_track_analyses FOR SELECT
  USING (is_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_track_analyses;
