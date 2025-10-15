-- Create function and trigger to send email notification on new follower
CREATE OR REPLACE FUNCTION notify_new_follower_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_email TEXT;
  follower_username TEXT;
BEGIN
  -- Get artist email
  SELECT email INTO artist_email
  FROM profiles
  WHERE id = NEW.artist_id;

  -- Get follower username
  SELECT username INTO follower_username
  FROM profiles
  WHERE id = NEW.follower_id;

  -- Create notification for admin about new follower
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT id, 'follow', 'New Follower Alert', follower_username || ' started following an artist (' || artist_email || ')', '/artist/' || NEW.artist_id
  FROM profiles
  WHERE email = 'info@bak55talent.co.ke';

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_follower_email
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION notify_new_follower_email();

-- Create function and trigger to send notification on track upload
CREATE OR REPLACE FUNCTION notify_track_upload_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_username TEXT;
  artist_email TEXT;
BEGIN
  -- Get artist info
  SELECT username, email INTO artist_username, artist_email
  FROM profiles
  WHERE id = NEW.artist_id;

  -- Create notification for admin about new track
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT id, 'upload', 'New Track Uploaded', 'Track "' || NEW.title || '" by ' || artist_username || ' (' || artist_email || ')', '/track/' || NEW.id
  FROM profiles
  WHERE email = 'info@bak55talent.co.ke';

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_track_upload_admin
AFTER INSERT ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION notify_track_upload_admin();

-- Create function and trigger for tip notifications
CREATE OR REPLACE FUNCTION notify_tip_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_email TEXT;
  artist_username TEXT;
  tipper_username TEXT;
BEGIN
  -- Get artist info
  SELECT username, email INTO artist_username, artist_email
  FROM profiles
  WHERE id = NEW.to_artist_id;

  -- Get tipper username
  SELECT username INTO tipper_username
  FROM profiles
  WHERE id = NEW.from_user_id;

  -- Send notification to admin
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT id, 'tip', 'New Tip Transaction', tipper_username || ' tipped ' || NEW.amount || ' BAKCoins to ' || artist_username || ' (' || artist_email || ')', '/wallet'
  FROM profiles
  WHERE email = 'info@bak55talent.co.ke';

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tip_admin
AFTER INSERT ON public.tips
FOR EACH ROW
EXECUTE FUNCTION notify_tip_admin();