-- Fix handle_new_user to generate unique usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _role public.app_role;
  _username TEXT;
  _suffix INTEGER := 0;
  _base_username TEXT;
BEGIN
  -- Extract role from metadata, default to 'artist'
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'artist');
  
  -- Generate base username from email or metadata
  _base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Make username unique by appending suffix if needed
  _username := _base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
    _suffix := _suffix + 1;
    _username := _base_username || _suffix;
  END LOOP;
  
  -- Insert profile with unique username
  INSERT INTO public.profiles (id, username, email, bio, location)
  VALUES (
    NEW.id,
    _username,
    NEW.email,
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'location'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT DO NOTHING;
  
  -- Create role-specific profile
  IF _role = 'artist' THEN
    INSERT INTO public.artist_profiles (user_id, stage_name, genres)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'stage_name', _username),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'genres', '[]'::jsonb)))
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF _role = 'brand' THEN
    INSERT INTO public.brand_profiles (user_id, company_name, industry, website, description)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', _username),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'website',
      NEW.raw_user_meta_data->>'bio'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;