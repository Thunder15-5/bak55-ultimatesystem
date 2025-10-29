-- BAK55 Artist Discovery Competition - Multi-Stage Enhancement
-- Phase 1: Database Schema

-- 1. Competition Stages Table
CREATE TABLE IF NOT EXISTS public.competition_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  stage_type TEXT NOT NULL CHECK (stage_type IN ('onboarding', 'mini_edition', 'studio_session', 'grand_finale')),
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_start_date TIMESTAMPTZ,
  voting_end_date TIMESTAMPTZ,
  max_participants INTEGER,
  elimination_count INTEGER,
  challenge_theme TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competition_stages_competition ON public.competition_stages(competition_id);
CREATE INDEX idx_competition_stages_status ON public.competition_stages(status);

ALTER TABLE public.competition_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competition stages viewable by everyone"
  ON public.competition_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins and brands can manage stages"
  ON public.competition_stages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'brand'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'brand'::app_role));

-- 2. Stage Submissions Table
CREATE TABLE IF NOT EXISTS public.stage_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.competition_stages(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'advanced', 'winner')),
  elimination_round INTEGER,
  stage_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  eliminated_at TIMESTAMPTZ,
  UNIQUE(stage_id, artist_id)
);

CREATE INDEX idx_stage_submissions_stage ON public.stage_submissions(stage_id);
CREATE INDEX idx_stage_submissions_artist ON public.stage_submissions(artist_id);
CREATE INDEX idx_stage_submissions_status ON public.stage_submissions(status);

ALTER TABLE public.stage_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stage submissions viewable by everyone"
  ON public.stage_submissions FOR SELECT
  USING (true);

CREATE POLICY "Artists can create own stage submissions"
  ON public.stage_submissions FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Admins can manage stage submissions"
  ON public.stage_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fan Badges Table
CREATE TABLE IF NOT EXISTS public.fan_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  badge_description TEXT,
  unlock_criteria JSONB DEFAULT '{}'::jsonb,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fan_badges_type ON public.fan_badges(badge_type);
CREATE INDEX idx_fan_badges_rarity ON public.fan_badges(rarity);

ALTER TABLE public.fan_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fan badges viewable by everyone"
  ON public.fan_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.fan_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.fan_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_id, competition_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON public.user_badges(badge_id);
CREATE INDEX idx_user_badges_competition ON public.user_badges(competition_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view all badges"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can award badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

-- 5. Enhanced Votes Table
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.competition_stages(id) ON DELETE SET NULL;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS voted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS vote_weight NUMERIC DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_votes_stage ON public.votes(stage_id);

-- 6. Artist Competition Journey Table
CREATE TABLE IF NOT EXISTS public.artist_competition_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_stage_id UUID REFERENCES public.competition_stages(id) ON DELETE SET NULL,
  total_votes_received INTEGER DEFAULT 0,
  highest_rank INTEGER,
  stages_participated INTEGER DEFAULT 0,
  is_eliminated BOOLEAN DEFAULT false,
  elimination_stage_id UUID REFERENCES public.competition_stages(id) ON DELETE SET NULL,
  final_placement INTEGER,
  journey_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, artist_id)
);

CREATE INDEX idx_journey_competition ON public.artist_competition_journey(competition_id);
CREATE INDEX idx_journey_artist ON public.artist_competition_journey(artist_id);
CREATE INDEX idx_journey_eliminated ON public.artist_competition_journey(is_eliminated);

ALTER TABLE public.artist_competition_journey ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journey viewable by everyone"
  ON public.artist_competition_journey FOR SELECT
  USING (true);

CREATE POLICY "Artists can view own journey"
  ON public.artist_competition_journey FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Admins can manage journeys"
  ON public.artist_competition_journey FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Competition Prizes Table
CREATE TABLE IF NOT EXISTS public.competition_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.competition_stages(id) ON DELETE SET NULL,
  placement INTEGER NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('cash', 'studio_time', 'mentorship', 'contract', 'exposure', 'bak_coins', 'music_video', 'promotion', 'live_performance')),
  prize_value NUMERIC,
  prize_description TEXT,
  sponsor_id UUID REFERENCES public.brand_profiles(id) ON DELETE SET NULL,
  is_awarded BOOLEAN DEFAULT false,
  awarded_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prizes_competition ON public.competition_prizes(competition_id);
CREATE INDEX idx_prizes_stage ON public.competition_prizes(stage_id);
CREATE INDEX idx_prizes_awarded ON public.competition_prizes(is_awarded);

ALTER TABLE public.competition_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prizes viewable by everyone"
  ON public.competition_prizes FOR SELECT
  USING (true);

CREATE POLICY "Admins and brands can manage prizes"
  ON public.competition_prizes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'brand'::app_role));

-- 8. Create trigger for updated_at on competition_stages
CREATE TRIGGER update_competition_stages_updated_at
  BEFORE UPDATE ON public.competition_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create trigger for updated_at on artist_competition_journey
CREATE TRIGGER update_journey_updated_at
  BEFORE UPDATE ON public.artist_competition_journey
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 10. Insert default badge types
INSERT INTO public.fan_badges (badge_type, badge_name, badge_icon, badge_description, unlock_criteria, rarity)
VALUES
  ('early_supporter', 'Early Supporter', '🌟', 'Among the first 100 voters in the competition', '{"vote_rank": 100}'::jsonb, 'rare'),
  ('loyal_voter', 'Loyal Voter', '💎', 'Voted in all stages of the competition', '{"all_stages": true}'::jsonb, 'epic'),
  ('talent_scout', 'Talent Scout', '🎯', 'Voted for an artist who made it to top 5', '{"artist_top_5": true}'::jsonb, 'rare'),
  ('mega_fan', 'Mega Fan', '🔥', 'Cast 50+ votes in a single competition', '{"votes_count": 50}'::jsonb, 'epic'),
  ('champion_predictor', 'Champion Predictor', '👑', 'Voted for the winner in the first round', '{"predicted_winner": true}'::jsonb, 'legendary'),
  ('stage_champion', 'Stage Champion', '⭐', 'Top voter in a specific stage', '{"top_voter_stage": true}'::jsonb, 'epic'),
  ('rising_star_finder', 'Rising Star Finder', '🚀', 'Supported the biggest dark horse', '{"dark_horse": true}'::jsonb, 'rare'),
  ('community_leader', 'Community Leader', '🤝', 'Referred 5+ voters to the platform', '{"referrals": 5}'::jsonb, 'rare'),
  ('golden_ear', 'Golden Ear', '👂', 'Prediction accuracy over 80%', '{"accuracy": 80}'::jsonb, 'legendary'),
  ('first_blood', 'First Blood', '⚡', 'First to vote in a new stage', '{"first_vote_stage": true}'::jsonb, 'common')
ON CONFLICT DO NOTHING;