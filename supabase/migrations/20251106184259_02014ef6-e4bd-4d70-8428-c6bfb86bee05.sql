-- Add banner_url to artist_profiles
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create share_rewards table to track rewards given for sharing
CREATE TABLE IF NOT EXISTS share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  artist_id UUID REFERENCES artist_profiles(user_id) ON DELETE SET NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 5,
  share_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on share_rewards
ALTER TABLE share_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own share rewards
CREATE POLICY "Users can view own share rewards"
ON share_rewards FOR SELECT
USING (auth.uid() = user_id);

-- System can create share rewards
CREATE POLICY "System can create share rewards"
ON share_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_share_rewards_user_id ON share_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_share_rewards_created_at ON share_rewards(created_at DESC);