-- Create admin activity log table
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('artist', 'fan', 'competition', 'payment', 'content', 'system')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_log_category ON admin_activity_log(event_category);
CREATE INDEX idx_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_type ON admin_activity_log(event_type);
CREATE INDEX idx_activity_log_user ON admin_activity_log(user_id);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
ON admin_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Enhance notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general' CHECK (category IN ('artist', 'fan', 'competition', 'payment', 'content', 'system', 'general'));

-- Index for admin notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(user_id, priority, read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category, created_at DESC);

-- Trigger: New Artist Registration
CREATE OR REPLACE FUNCTION notify_admin_artist_signup()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  artist_email TEXT;
  artist_username TEXT;
BEGIN
  SELECT email, username INTO artist_email, artist_username
  FROM profiles WHERE id = NEW.user_id;
  
  SELECT p.id INTO admin_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      admin_id,
      'artist_signup',
      '🎤 New Artist Registered',
      artist_username || ' (' || artist_email || ') just joined as an artist',
      '/artist/' || NEW.user_id,
      'normal',
      'artist'
    );
    
    INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
    VALUES (
      NEW.user_id,
      'artist_registration',
      'artist',
      'New artist registration: ' || artist_username,
      jsonb_build_object('email', artist_email, 'stage_name', NEW.stage_name)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_artist_signup
AFTER INSERT ON artist_profiles
FOR EACH ROW EXECUTE FUNCTION notify_admin_artist_signup();

-- Trigger: Artist Profile Update
CREATE OR REPLACE FUNCTION notify_admin_artist_update()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  artist_username TEXT;
BEGIN
  IF OLD.stage_name IS DISTINCT FROM NEW.stage_name 
     OR OLD.bio IS DISTINCT FROM NEW.bio
     OR OLD.genres IS DISTINCT FROM NEW.genres THEN
    
    SELECT username INTO artist_username FROM profiles WHERE id = NEW.user_id;
    
    SELECT p.id INTO admin_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, priority, category)
      VALUES (
        admin_id,
        'artist_update',
        '✏️ Artist Profile Updated',
        artist_username || ' updated their profile',
        '/artist/' || NEW.user_id,
        'low',
        'artist'
      );
      
      INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
      VALUES (
        NEW.user_id,
        'artist_profile_update',
        'artist',
        'Artist updated profile: ' || artist_username,
        jsonb_build_object('changes', 'profile_updated')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_artist_update
AFTER UPDATE ON artist_profiles
FOR EACH ROW EXECUTE FUNCTION notify_admin_artist_update();

-- Trigger: Competition Entry Submission
CREATE OR REPLACE FUNCTION notify_admin_competition_entry()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  artist_username TEXT;
  comp_title TEXT;
BEGIN
  SELECT username INTO artist_username FROM profiles WHERE id = NEW.artist_id;
  SELECT title INTO comp_title FROM competitions WHERE id = NEW.competition_id;
  
  SELECT p.id INTO admin_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
  LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      admin_id,
      'competition_entry',
      '🏆 New Competition Entry',
      artist_username || ' submitted to "' || comp_title || '"',
      '/competition/' || NEW.competition_id,
      'high',
      'competition'
    );
    
    INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
    VALUES (
      NEW.artist_id,
      'competition_submission',
      'competition',
      'New submission to competition: ' || comp_title,
      jsonb_build_object('competition_id', NEW.competition_id, 'track_title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_competition_entry
AFTER INSERT ON submissions
FOR EACH ROW EXECUTE FUNCTION notify_admin_competition_entry();

-- Trigger: New Fan Registration
CREATE OR REPLACE FUNCTION notify_admin_fan_signup()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  is_artist BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.id AND role = 'artist'
  ) INTO is_artist;
  
  IF NOT is_artist THEN
    SELECT p.id INTO admin_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, priority, category)
      VALUES (
        admin_id,
        'fan_signup',
        '👤 New Fan Registered',
        NEW.username || ' (' || NEW.email || ') joined as a fan',
        '/profile/' || NEW.id,
        'low',
        'fan'
      );
      
      INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
      VALUES (
        NEW.id,
        'fan_registration',
        'fan',
        'New fan registration: ' || NEW.username,
        jsonb_build_object('email', NEW.email)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_fan_signup
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION notify_admin_fan_signup();

-- Trigger: Fan Voting Activity (batch notifications)
CREATE OR REPLACE FUNCTION notify_admin_voting_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  vote_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO vote_count
  FROM votes
  WHERE submission_id = NEW.submission_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF vote_count % 10 = 0 THEN
    SELECT p.id INTO admin_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
      VALUES (
        NEW.user_id,
        'voting_milestone',
        'fan',
        'Submission received ' || vote_count || ' votes in last hour',
        jsonb_build_object('submission_id', NEW.submission_id, 'vote_count', vote_count)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_voting
AFTER INSERT ON votes
FOR EACH ROW EXECUTE FUNCTION notify_admin_voting_activity();

-- Trigger: Competition Status Change
CREATE OR REPLACE FUNCTION notify_admin_competition_status()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT p.id INTO admin_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, priority, category)
      VALUES (
        admin_id,
        'competition_status',
        '🏁 Competition Status Changed',
        '"' || NEW.title || '" is now ' || NEW.status,
        '/competition/' || NEW.id,
        'high',
        'competition'
      );
      
      INSERT INTO admin_activity_log (event_type, event_category, description, metadata)
      VALUES (
        'competition_status_change',
        'competition',
        'Competition status changed: ' || NEW.title,
        jsonb_build_object('competition_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_competition_status
AFTER UPDATE ON competitions
FOR EACH ROW EXECUTE FUNCTION notify_admin_competition_status();

-- Trigger: Payment Transaction Success
CREATE OR REPLACE FUNCTION notify_admin_payment_success()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_email TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'success' THEN
    SELECT email INTO user_email FROM profiles WHERE id = NEW.user_id;
    
    SELECT p.id INTO admin_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.email = 'info@bak55talent.co.ke'
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, priority, category)
      VALUES (
        admin_id,
        'payment_success',
        '💰 Payment Received',
        user_email || ' purchased ' || (NEW.amount / 20)::numeric(10,2) || ' BAKCoins',
        '/admin',
        'normal',
        'payment'
      );
      
      INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
      VALUES (
        NEW.user_id,
        'payment_success',
        'payment',
        'Payment successful: ' || NEW.amount || ' ' || NEW.currency,
        jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount, 'provider', NEW.payment_provider)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_admin_payment
AFTER UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION notify_admin_payment_success();