-- Create RPC function for public platform stats (safe for anonymous users)
CREATE OR REPLACE FUNCTION public.get_public_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'artists_count', (SELECT COUNT(*) FROM artist_profiles),
    'tracks_count', (SELECT COUNT(*) FROM tracks WHERE moderation_status = 'approved' OR moderation_status IS NULL),
    'competitions_count', (SELECT COUNT(*) FROM competitions WHERE status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create RPC function to get public artist data (no sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_artists(limit_count int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  stage_name text,
  verified boolean,
  genres text[],
  avatar_url text,
  display_name text,
  bio text,
  username text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.user_id,
    ap.stage_name,
    COALESCE(ap.verified, false) as verified,
    ap.genres,
    p.avatar_url,
    p.display_name,
    p.bio,
    p.username
  FROM artist_profiles ap
  INNER JOIN profiles p ON p.id = ap.user_id
  ORDER BY ap.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_artists(int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_artists(int) TO authenticated;

-- Create trigger function to notify admins when new artist signs up
CREATE OR REPLACE FUNCTION public.notify_admins_new_artist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  artist_name text;
BEGIN
  -- Get the stage name or display name
  SELECT COALESCE(NEW.stage_name, p.display_name, p.username)
  INTO artist_name
  FROM profiles p
  WHERE p.id = NEW.user_id;

  -- Insert notification for each admin
  FOR admin_id IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      category,
      priority,
      title,
      message,
      link
    ) VALUES (
      admin_id,
      'artist_signup',
      'artist',
      'high',
      'New Artist Signup',
      'A new artist "' || COALESCE(artist_name, 'Unknown') || '" has joined the platform.',
      '/admin'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new artist signups
DROP TRIGGER IF EXISTS on_new_artist_signup ON artist_profiles;
CREATE TRIGGER on_new_artist_signup
  AFTER INSERT ON artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_artist();

-- Create trigger function to notify admins when new track is uploaded (pending moderation)
CREATE OR REPLACE FUNCTION public.notify_admins_new_track()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  artist_name text;
BEGIN
  -- Only notify for pending tracks
  IF NEW.moderation_status = 'pending' OR NEW.moderation_status IS NULL THEN
    -- Get the artist name
    SELECT COALESCE(ap.stage_name, p.display_name, p.username)
    INTO artist_name
    FROM profiles p
    LEFT JOIN artist_profiles ap ON ap.user_id = p.id
    WHERE p.id = NEW.artist_id;

    -- Insert notification for each admin
    FOR admin_id IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        category,
        priority,
        title,
        message,
        link
      ) VALUES (
        admin_id,
        'track_pending',
        'content',
        'normal',
        'New Track Pending Review',
        'Track "' || NEW.title || '" by ' || COALESCE(artist_name, 'Unknown') || ' needs moderation.',
        '/admin'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new track uploads
DROP TRIGGER IF EXISTS on_new_track_upload ON tracks;
CREATE TRIGGER on_new_track_upload
  AFTER INSERT ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_track();