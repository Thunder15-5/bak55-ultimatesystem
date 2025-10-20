-- Add missing transaction types to enum
-- This migration adds 'spending', 'withdrawal', and 'income' to the transaction_type enum

DO $$
BEGIN
  -- Add 'spending' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'spending' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'spending';
  END IF;
  
  -- Add 'withdrawal' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'withdrawal' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'withdrawal';
  END IF;
  
  -- Add 'income' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'income' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'income';
  END IF;
END$$;

-- Drop existing public_profiles view if it exists
DROP VIEW IF EXISTS public.public_profiles;

-- Create public_profiles view to protect email privacy
CREATE VIEW public.public_profiles AS
SELECT
  id,
  username,
  avatar_url,
  bio,
  location,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles without email addresses for privacy protection';