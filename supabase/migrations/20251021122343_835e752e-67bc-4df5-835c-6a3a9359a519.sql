-- Add user_type column to early_access_signups table
ALTER TABLE early_access_signups 
ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('artist', 'fan'));

-- Create function to check if user can upload tracks
CREATE OR REPLACE FUNCTION can_user_upload_track(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  approved_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count approved tracks
  SELECT COUNT(*) INTO approved_count
  FROM tracks
  WHERE artist_id = user_id_param
    AND moderation_status = 'approved';
  
  -- Count total tracks
  SELECT COUNT(*) INTO total_count
  FROM tracks
  WHERE artist_id = user_id_param;
  
  -- New users can upload 1 track
  -- Once they have at least 1 approved track, unlimited uploads
  IF approved_count > 0 THEN
    RETURN TRUE;
  ELSIF total_count < 1 THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update tracks table default moderation status to pending
ALTER TABLE tracks 
ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_moderation_status ON tracks(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_early_access_signups_created ON early_access_signups(created_at DESC);