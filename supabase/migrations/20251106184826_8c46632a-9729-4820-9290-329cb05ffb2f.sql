-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uses_count INTEGER NOT NULL DEFAULT 0
);

-- Create referrals table to track who used whose code
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 50,
  rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Create artist_badges table for achievements
CREATE TABLE IF NOT EXISTS artist_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create artist_earned_badges junction table
CREATE TABLE IF NOT EXISTS artist_earned_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES artist_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(artist_id, badge_id)
);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_earned_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code"
ON referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code"
ON referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals"
ON referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals"
ON referrals FOR INSERT
WITH CHECK (true);

-- RLS Policies for artist_badges
CREATE POLICY "Anyone can view badges"
ON artist_badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON artist_badges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for artist_earned_badges
CREATE POLICY "Anyone can view earned badges"
ON artist_earned_badges FOR SELECT
USING (true);

CREATE POLICY "System can award badges"
ON artist_earned_badges FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_artist_earned_badges_artist_id ON artist_earned_badges(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_earned_badges_badge_id ON artist_earned_badges(badge_id);

-- Insert default achievement badges
INSERT INTO artist_badges (badge_type, badge_name, badge_description, badge_icon, requirement_value) VALUES
('followers', 'Rising Star', 'Reach 100 followers', '🌟', 100),
('followers', 'Popular Artist', 'Reach 1,000 followers', '⭐', 1000),
('followers', 'Mega Star', 'Reach 10,000 followers', '💫', 10000),
('followers', 'Legend', 'Reach 100,000 followers', '👑', 100000),
('plays', 'First Plays', 'Get 100 plays', '🎵', 100),
('plays', 'Hit Maker', 'Get 1,000 plays', '🎶', 1000),
('plays', 'Chart Topper', 'Get 10,000 plays', '🔥', 10000),
('plays', 'Platinum', 'Get 100,000 plays', '💎', 100000),
('tracks', 'First Upload', 'Upload 1 track', '🎤', 1),
('tracks', 'Prolific', 'Upload 5 tracks', '🎸', 5),
('tracks', 'Album Artist', 'Upload 10 tracks', '💿', 10),
('tracks', 'Discography Master', 'Upload 25 tracks', '🏆', 25)
ON CONFLICT DO NOTHING;