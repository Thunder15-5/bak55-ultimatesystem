-- Fix search_path security issue in handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _activation_code TEXT;
  _default_role TEXT;
  _display_name TEXT;
  _stage_name TEXT;
  _company_name TEXT;
BEGIN
  -- Generate 6-digit activation code
  _activation_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  
  -- Determine default role from metadata (handle both camelCase and snake_case)
  _default_role := COALESCE(NEW.raw_user_meta_data->>'role', 'fan');
  
  -- Get display name (try both formats)
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'displayName',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Get stage name (try both formats)
  _stage_name := COALESCE(
    NEW.raw_user_meta_data->>'stageName',
    NEW.raw_user_meta_data->>'stage_name',
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Get company name (try both formats)
  _company_name := COALESCE(
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Insert profile with activation code (not activated yet)
  INSERT INTO public.profiles (
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
    FALSE,
    NOW(),
    _display_name,
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'location',
    NULL
  );
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _default_role);
  
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
      COALESCE(
        (SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'genres'))),
        '{}'::text[]
      ),
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
      NEW.raw_user_meta_data->>'industry',
      FALSE
    );
  END IF;
  
  RETURN NEW;
END;
$$;