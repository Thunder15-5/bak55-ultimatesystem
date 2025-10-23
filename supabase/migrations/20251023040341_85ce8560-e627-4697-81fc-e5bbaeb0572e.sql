-- Phase 1: Competition Creation Notification Trigger
CREATE OR REPLACE FUNCTION notify_admin_competition_created()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  creator_username TEXT;
BEGIN
  SELECT username INTO creator_username FROM profiles WHERE id = NEW.created_by;
  
  SELECT p.id INTO admin_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      admin_id,
      'competition_created',
      '🏆 New Competition Created',
      creator_username || ' created "' || NEW.title || '"',
      '/competition/' || NEW.id,
      'high',
      'competition'
    );
    
    INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
    VALUES (
      NEW.created_by,
      'competition_created',
      'competition',
      'Competition created: ' || NEW.title,
      jsonb_build_object('competition_id', NEW.id, 'prize_amount', NEW.prize_amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_competition_created
AFTER INSERT ON competitions
FOR EACH ROW EXECUTE FUNCTION notify_admin_competition_created();

-- Phase 4: Track Moderation Notification Triggers
CREATE OR REPLACE FUNCTION notify_artist_track_moderation()
RETURNS TRIGGER AS $$
DECLARE
  artist_email TEXT;
  artist_username TEXT;
BEGIN
  -- Only notify when status changes from pending to approved/rejected
  IF OLD.moderation_status = 'pending' AND NEW.moderation_status != 'pending' THEN
    SELECT username, email INTO artist_username, artist_email
    FROM profiles WHERE id = NEW.artist_id;
    
    IF NEW.moderation_status = 'approved' THEN
      -- Notify artist of approval
      INSERT INTO notifications (user_id, type, title, message, link, priority, category)
      VALUES (
        NEW.artist_id,
        'track_approved',
        '✅ Track Approved!',
        'Your track "' || NEW.title || '" has been approved and is now live',
        '/track/' || NEW.id,
        'high',
        'content'
      );
      
      -- Log activity
      INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
      VALUES (
        NEW.artist_id,
        'track_approved',
        'content',
        'Track approved: ' || NEW.title,
        jsonb_build_object('track_id', NEW.id, 'artist', artist_username)
      );
    ELSIF NEW.moderation_status = 'rejected' THEN
      -- Notify artist of rejection
      INSERT INTO notifications (user_id, type, title, message, link, priority, category)
      VALUES (
        NEW.artist_id,
        'track_rejected',
        '❌ Track Rejected',
        'Your track "' || NEW.title || '" was not approved. ' || COALESCE('Reason: ' || NEW.moderation_notes, 'Please review our content guidelines.'),
        '/upload',
        'high',
        'content'
      );
      
      -- Log activity
      INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
      VALUES (
        NEW.artist_id,
        'track_rejected',
        'content',
        'Track rejected: ' || NEW.title,
        jsonb_build_object('track_id', NEW.id, 'artist', artist_username, 'reason', NEW.moderation_notes)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_artist_track_moderation
AFTER UPDATE ON tracks
FOR EACH ROW EXECUTE FUNCTION notify_artist_track_moderation();