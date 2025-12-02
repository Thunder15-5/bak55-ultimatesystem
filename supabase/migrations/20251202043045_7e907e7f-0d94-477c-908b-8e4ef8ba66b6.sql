-- Fix handle_new_user function to create artist_profiles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    FALSE,
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
  
  -- Create artist_profiles entry if role is artist
  IF _default_role = 'artist' THEN
    INSERT INTO artist_profiles (
      user_id,
      stage_name,
      genres,
      verified,
      talent_score,
      total_earnings
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'stageName', 
        NEW.raw_user_meta_data->>'username', 
        SPLIT_PART(NEW.email, '@', 1)
      ),
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
    INSERT INTO brand_profiles (
      user_id,
      company_name,
      industry,
      verified
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'companyName',
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      NEW.raw_user_meta_data->>'industry',
      FALSE
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create artist_applications table for Founders Season applications
CREATE TABLE IF NOT EXISTS public.artist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city TEXT NOT NULL,
  age INTEGER NOT NULL,
  
  -- Artist Info
  stage_name TEXT NOT NULL,
  primary_genres TEXT[] NOT NULL,
  years_experience INTEGER,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  portfolio_link TEXT,
  
  -- Application Questions
  why_join TEXT NOT NULL,
  what_makes_unique TEXT NOT NULL,
  demo_track_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_age CHECK (age >= 16 AND age <= 26),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'shortlisted'))
);

-- Enable RLS on artist_applications
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artist_applications
CREATE POLICY "Users can create own applications"
ON public.artist_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications"
ON public.artist_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
ON public.artist_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications"
ON public.artist_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for performance
CREATE INDEX idx_artist_applications_user_id ON public.artist_applications(user_id);
CREATE INDEX idx_artist_applications_status ON public.artist_applications(status);
CREATE INDEX idx_artist_applications_created_at ON public.artist_applications(created_at DESC);