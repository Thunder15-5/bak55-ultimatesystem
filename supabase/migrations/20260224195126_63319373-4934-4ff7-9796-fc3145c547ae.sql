
-- Fix the notify_admin_artist_update trigger to only reference artist_profiles columns
CREATE OR REPLACE FUNCTION public.notify_admin_artist_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_id UUID;
  artist_username TEXT;
BEGIN
  IF OLD.stage_name IS DISTINCT FROM NEW.stage_name 
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
$function$;

-- Now add hidden flag to artist_profiles
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- Hide Onefive
UPDATE public.artist_profiles SET hidden = true WHERE user_id = 'ae7ba476-0374-4e47-97c2-3acd846f5bf1';

-- Update get_public_artists to exclude hidden artists
CREATE OR REPLACE FUNCTION public.get_public_artists(limit_count integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, stage_name text, verified boolean, genres text[], avatar_url text, display_name text, bio text, username text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE COALESCE(ap.hidden, false) = false
  ORDER BY ap.created_at DESC
  LIMIT limit_count;
END;
$function$;
