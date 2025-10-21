-- Fix search_path for can_user_upload_track function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;