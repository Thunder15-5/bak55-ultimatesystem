
-- Fix 1: referrals table - only allow system/edge function to create referrals (not any user)
DROP POLICY IF EXISTS "System can create referrals" ON public.referrals;
CREATE POLICY "Only service role can create referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Fix 2: user_badges table - only admins/system can award badges  
DROP POLICY IF EXISTS "System can award badges" ON public.user_badges;
CREATE POLICY "Only admins can award user badges"
ON public.user_badges
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Fix 3: Create a safe public view for profiles that hides PII
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  bio,
  location,
  created_at
FROM public.profiles;
-- Excludes: email, phone_number, activation_code, activation_code_sent_at
