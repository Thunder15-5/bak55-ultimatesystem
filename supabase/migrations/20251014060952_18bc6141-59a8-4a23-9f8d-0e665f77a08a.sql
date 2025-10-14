-- Fix existing transaction types for consistency
UPDATE transactions 
SET type = 'earning' 
WHERE description LIKE '%Purchased%BAKCoins%' 
  OR description LIKE '%Streaming royalty%'
  OR description LIKE '%Competition prize%';

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
ON comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create track_likes table
CREATE TABLE IF NOT EXISTS track_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, user_id)
);

-- Enable RLS on track_likes
ALTER TABLE track_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for track_likes
CREATE POLICY "Anyone can view track likes"
ON track_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like tracks"
ON track_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tracks"
ON track_likes FOR DELETE
USING (auth.uid() = user_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_track_id ON listening_history(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_votes_submission_id ON votes(submission_id);

-- Create trigger function to auto-update artist earnings
CREATE OR REPLACE FUNCTION update_artist_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'earning' THEN
    UPDATE artist_profiles
    SET total_earnings = total_earnings + NEW.amount,
        updated_at = NOW()
    WHERE user_id = (
      SELECT user_id FROM wallets WHERE id = NEW.wallet_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS on_earning_transaction ON transactions;
CREATE TRIGGER on_earning_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_artist_earnings();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE track_likes;