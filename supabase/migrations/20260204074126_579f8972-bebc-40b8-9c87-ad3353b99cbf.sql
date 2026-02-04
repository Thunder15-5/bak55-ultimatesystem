-- Update producer stats on license sale
CREATE OR REPLACE FUNCTION public.update_producer_stats_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE producer_profiles
    SET 
        total_earnings = total_earnings + NEW.producer_earnings,
        total_licenses_issued = total_licenses_issued + 1,
        updated_at = now()
    WHERE user_id = NEW.producer_id;
    
    UPDATE beats
    SET total_leases_sold = total_leases_sold + 1
    WHERE id = NEW.beat_id;
    
    IF NEW.license_type = 'exclusive' THEN
        UPDATE beats
        SET is_sold_exclusive = true, status = 'sold_out'
        WHERE id = NEW.beat_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_beat_license_created
    AFTER INSERT ON public.beat_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_producer_stats_on_sale();

-- Update beat likes count
CREATE OR REPLACE FUNCTION public.update_beat_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE beats SET likes = likes + 1 WHERE id = NEW.beat_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE beats SET likes = likes - 1 WHERE id = OLD.beat_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_beat_like_change
    AFTER INSERT OR DELETE ON public.beat_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_beat_likes_count();

-- Update producer average rating
CREATE OR REPLACE FUNCTION public.update_producer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE producer_profiles
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM producer_reviews
            WHERE producer_id = NEW.producer_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM producer_reviews
            WHERE producer_id = NEW.producer_id
        ),
        updated_at = now()
    WHERE user_id = NEW.producer_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_producer_review_created
    AFTER INSERT OR UPDATE ON public.producer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_producer_rating();

-- Notify admins of new producer signup
CREATE OR REPLACE FUNCTION public.notify_admins_new_producer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    admin_id uuid;
BEGIN
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
            'producer_signup',
            'producer',
            'high',
            'New Producer Signup',
            'Producer "' || COALESCE(NEW.producer_name, 'Unknown') || '" has joined the platform.',
            '/admin'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_producer_signup
    AFTER INSERT ON public.producer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_new_producer();

-- Get public producers for discovery
CREATE OR REPLACE FUNCTION public.get_public_producers(limit_count integer DEFAULT 10)
RETURNS TABLE(
    user_id uuid, 
    producer_name text, 
    verified boolean, 
    genres text[], 
    avatar_url text, 
    display_name text, 
    bio text, 
    username text,
    producer_tier text,
    average_rating numeric,
    total_beats_sold integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pp.user_id,
    pp.producer_name,
    COALESCE(pp.verified, false) as verified,
    pp.genres,
    p.avatar_url,
    p.display_name,
    p.bio,
    p.username,
    pp.producer_tier,
    pp.average_rating,
    pp.total_beats_sold
  FROM producer_profiles pp
  INNER JOIN profiles p ON p.id = pp.user_id
  ORDER BY pp.total_beats_sold DESC, pp.created_at DESC
  LIMIT limit_count;
END;
$function$;

-- Update get_primary_role to include producer priority
CREATE OR REPLACE FUNCTION public.get_primary_role(user_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT COALESCE(
        (SELECT role::text FROM public.user_roles WHERE user_id = user_id_param ORDER BY 
            CASE role 
                WHEN 'admin' THEN 1 
                WHEN 'brand' THEN 2 
                WHEN 'producer' THEN 3
                WHEN 'artist' THEN 4 
                ELSE 5 
            END 
        LIMIT 1),
        'fan'
    )
$function$;

-- Update handle_new_user to support producer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _default_role TEXT;
  _display_name TEXT;
  _stage_name TEXT;
  _company_name TEXT;
  _producer_name TEXT;
  _genres TEXT[];
  _username TEXT;
BEGIN
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  _default_role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''),
    'fan'
  );
  
  _display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'displayName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    _username
  );
  
  _stage_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'stageName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'stage_name'), ''),
    _username
  );
  
  _company_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'companyName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
    _username
  );
  
  _producer_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'producerName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'producer_name'), ''),
    _username
  );
  
  _genres := '{}'::TEXT[];
  BEGIN
    IF NEW.raw_user_meta_data ? 'genres' 
       AND NEW.raw_user_meta_data->'genres' IS NOT NULL 
       AND jsonb_typeof(NEW.raw_user_meta_data->'genres') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'genres'))
      INTO _genres;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    _genres := '{}'::TEXT[];
  END;
  
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    is_activated,
    display_name,
    bio,
    location
  )
  VALUES (
    NEW.id,
    _username,
    NEW.email,
    TRUE,
    _display_name,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'bio'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'location'), '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _default_role::app_role);
  
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  IF _default_role = 'artist' THEN
    INSERT INTO public.artist_profiles (
      user_id,
      stage_name,
      genres,
      verified,
      talent_score,
      total_earnings
    )
    VALUES (
      NEW.id,
      _stage_name,
      _genres,
      FALSE,
      0,
      0
    );
  END IF;
  
  IF _default_role = 'brand' THEN
    INSERT INTO public.brand_profiles (
      user_id,
      company_name,
      industry,
      verified
    )
    VALUES (
      NEW.id,
      _company_name,
      NULLIF(TRIM(NEW.raw_user_meta_data->>'industry'), ''),
      FALSE
    );
  END IF;
  
  IF _default_role = 'producer' THEN
    INSERT INTO public.producer_profiles (
      user_id,
      producer_name,
      genres,
      verified,
      producer_tier,
      total_earnings
    )
    VALUES (
      NEW.id,
      _producer_name,
      _genres,
      FALSE,
      'starter',
      0
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user for %: % %', NEW.email, SQLERRM, SQLSTATE;
  
  BEGIN
    INSERT INTO public.profiles (id, username, email, is_activated)
    VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), NEW.email, TRUE)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'fan'::app_role)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Fallback profile creation failed: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;