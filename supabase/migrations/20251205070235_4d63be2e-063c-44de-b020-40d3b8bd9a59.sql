-- Auto-activate all existing users who have NULL activation code or no is_activated value
UPDATE public.profiles 
SET is_activated = TRUE 
WHERE is_activated IS NULL OR is_activated = FALSE;

-- Drop and recreate the handle_new_user function with auto-activation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _default_role TEXT;
  _display_name TEXT;
  _stage_name TEXT;
  _company_name TEXT;
  _genres TEXT[];
  _username TEXT;
BEGIN
  -- Get username with fallback
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Determine default role from metadata (default to 'fan')
  _default_role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''),
    'fan'
  );
  
  -- Get display name (try multiple formats)
  _display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'displayName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    _username
  );
  
  -- Get stage name (try multiple formats)
  _stage_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'stageName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'stage_name'), ''),
    _username
  );
  
  -- Get company name (try multiple formats)
  _company_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'companyName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
    _username
  );
  
  -- Safely parse genres array
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
  
  -- Insert profile with is_activated = TRUE (no activation required)
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
    TRUE,  -- Auto-activate all new users
    _display_name,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'bio'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'location'), '')
  );
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _default_role::app_role);
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  -- Create artist_profiles entry if role is artist
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
  
  -- Create brand_profiles entry if role is brand
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
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'Error in handle_new_user for %: % %', NEW.email, SQLERRM, SQLSTATE;
  
  -- Still try to create minimal profile so user can log in
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();