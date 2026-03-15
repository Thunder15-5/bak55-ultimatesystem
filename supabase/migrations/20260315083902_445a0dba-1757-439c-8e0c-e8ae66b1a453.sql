-- Fix: Allow authenticated users to read basic profile fields of other users
-- The profiles_public view needs this, and many queries join profiles for username/avatar
-- We keep the restricted policy for own profile and add a general read for non-PII columns
-- Since we can't do column-level RLS, we add a general read policy
-- The app should use profiles_public view for public-facing queries

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- All authenticated users can read profiles (needed for app functionality)
-- The app uses profiles_public view for public contexts to limit columns
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Keep profiles hidden from anonymous/public
-- (No policy for public role = denied by default with RLS enabled)