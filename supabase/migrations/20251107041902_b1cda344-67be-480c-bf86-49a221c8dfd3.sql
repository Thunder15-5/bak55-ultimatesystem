-- Fan Rewards Program Tables
CREATE TABLE IF NOT EXISTS fan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('daily_login', 'track_play', 'track_like', 'artist_follow', 'track_share', 'comment', 'vote', 'referral')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fan_rewards_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  min_points INTEGER NOT NULL,
  reward_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  badge_icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Artist Collaboration Tables
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_artist_id UUID NOT NULL REFERENCES artist_profiles(user_id) ON DELETE CASCADE,
  to_artist_id UUID NOT NULL REFERENCES artist_profiles(user_id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  project_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_collaboration CHECK (from_artist_id != to_artist_id)
);

CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES collaboration_requests(id) ON DELETE SET NULL,
  artist_ids UUID[] NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Live Streaming Tables
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(stream_id, user_id)
);

-- Enable RLS
ALTER TABLE fan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_rewards_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fan_activities
CREATE POLICY "Users can view own activities" ON fan_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create activities" ON fan_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fan_rewards_tiers
CREATE POLICY "Anyone can view reward tiers" ON fan_rewards_tiers FOR SELECT USING (true);

-- RLS Policies for collaboration_requests
CREATE POLICY "Artists can view their collaboration requests" ON collaboration_requests FOR SELECT 
USING (auth.uid() = from_artist_id OR auth.uid() = to_artist_id);

CREATE POLICY "Artists can create collaboration requests" ON collaboration_requests FOR INSERT 
WITH CHECK (auth.uid() = from_artist_id);

CREATE POLICY "Artists can update their received requests" ON collaboration_requests FOR UPDATE 
USING (auth.uid() = to_artist_id);

-- RLS Policies for collaborations
CREATE POLICY "Users can view collaborations" ON collaborations FOR SELECT 
USING (auth.uid() = ANY(artist_ids));

CREATE POLICY "Collaborating artists can update" ON collaborations FOR UPDATE 
USING (auth.uid() = ANY(artist_ids));

-- RLS Policies for live_streams
CREATE POLICY "Anyone can view live/scheduled streams" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Artists can create streams" ON live_streams FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can update own streams" ON live_streams FOR UPDATE USING (auth.uid() = artist_id);

-- RLS Policies for stream_viewers
CREATE POLICY "Users can view stream viewers" ON stream_viewers FOR SELECT USING (true);
CREATE POLICY "Users can join streams" ON stream_viewers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default reward tiers
INSERT INTO fan_rewards_tiers (tier_name, min_points, reward_multiplier, badge_icon) VALUES
  ('Bronze Fan', 0, 1.0, '🥉'),
  ('Silver Fan', 500, 1.2, '🥈'),
  ('Gold Fan', 2000, 1.5, '🥇'),
  ('Platinum Fan', 5000, 2.0, '💎'),
  ('Diamond Fan', 10000, 2.5, '💠')
ON CONFLICT (tier_name) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fan_activities_user_id ON fan_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_activities_created_at ON fan_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_artists ON collaboration_requests(from_artist_id, to_artist_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled ON live_streams(scheduled_start);

-- Trigger to update updated_at on collaboration_requests
CREATE OR REPLACE FUNCTION update_collaboration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collaboration_requests_updated_at
BEFORE UPDATE ON collaboration_requests
FOR EACH ROW
EXECUTE FUNCTION update_collaboration_updated_at();