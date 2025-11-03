-- ==========================================
-- PHASE 1: EMAIL ACTIVATION SYSTEM
-- ==========================================

-- Add activation fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS activation_code TEXT,
ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS activation_code_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_activation ON profiles(activation_code);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);

-- Update handle_new_user function to generate activation codes and disable auto-confirm
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _activation_code TEXT;
  _default_role TEXT;
BEGIN
  -- Generate 6-digit activation code
  _activation_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  
  -- Determine default role from metadata
  _default_role := COALESCE(NEW.raw_user_meta_data->>'role', 'fan');
  
  -- Insert profile with activation code (not activated yet)
  INSERT INTO profiles (
    id, 
    username, 
    email, 
    activation_code, 
    is_activated,
    activation_code_sent_at,
    display_name,
    bio,
    location,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    _activation_code,
    FALSE, -- Not activated by default
    NOW(),
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'location',
    NULL
  );
  
  -- Create default role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, _default_role);
  
  -- Create wallet
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PHASE 2: COMPETITION ENHANCEMENTS
-- ==========================================

-- Add visibility column for "Coming Soon" competitions
ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'active' 
CHECK (visibility IN ('draft', 'coming_soon', 'active', 'completed'));

CREATE INDEX IF NOT EXISTS idx_competitions_visibility ON competitions(visibility);

-- ==========================================
-- PHASE 3: ARTIST UPLOAD RESTRICTIONS
-- ==========================================

-- Update can_user_upload_track to enforce 1 track limit for free users
CREATE OR REPLACE FUNCTION can_user_upload_track(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  track_count INTEGER;
  has_subscription BOOLEAN;
BEGIN
  -- Count approved tracks for this user
  SELECT COUNT(*) INTO track_count
  FROM tracks
  WHERE artist_id = user_id_param
    AND moderation_status = 'approved';
  
  -- Check if user has active subscription
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_id_param 
      AND status = 'active'
      AND expires_at > NOW()
  ) INTO has_subscription;
  
  -- Free users can upload 1 track, subscribed users unlimited
  IF has_subscription THEN
    RETURN TRUE;
  ELSE
    RETURN track_count < 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create competition entry restriction function
CREATE OR REPLACE FUNCTION can_enter_competition(user_id_param UUID, competition_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_entries INTEGER;
  has_subscription BOOLEAN;
  existing_entry BOOLEAN;
BEGIN
  -- Check if already entered this specific competition
  SELECT EXISTS (
    SELECT 1 FROM submissions
    WHERE artist_id = user_id_param
      AND competition_id = competition_id_param
      AND status IN ('pending', 'approved')
  ) INTO existing_entry;
  
  IF existing_entry THEN
    RETURN FALSE; -- Already entered this competition
  END IF;
  
  -- Count active competition entries across all competitions
  SELECT COUNT(DISTINCT competition_id) INTO active_entries
  FROM submissions
  WHERE artist_id = user_id_param
    AND status IN ('pending', 'approved')
    AND competition_id IN (
      SELECT id FROM competitions 
      WHERE status = 'active' 
        AND end_date > NOW()
    );
  
  -- Check subscription status
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_id_param 
      AND status = 'active'
      AND expires_at > NOW()
  ) INTO has_subscription;
  
  -- Free users: 1 active competition only
  -- Subscribed users: unlimited competitions
  IF has_subscription THEN
    RETURN TRUE;
  ELSE
    RETURN active_entries < 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PHASE 4: ROLE DISPLAY PRIORITY FUNCTION
-- ==========================================

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION get_primary_role(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  -- Get all roles for user
  SELECT ARRAY_AGG(role ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'artist' THEN 2
      WHEN 'brand' THEN 3
      WHEN 'fan' THEN 4
      ELSE 5
    END
  ) INTO user_roles
  FROM user_roles
  WHERE user_id = user_id_param;
  
  -- Return highest priority role
  IF user_roles IS NOT NULL AND array_length(user_roles, 1) > 0 THEN
    RETURN user_roles[1];
  ELSE
    RETURN 'fan'; -- Default to fan if no roles found
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;