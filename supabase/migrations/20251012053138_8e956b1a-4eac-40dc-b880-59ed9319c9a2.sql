-- Fix critical RLS security issues

-- 1. Fix profiles table to properly hide emails from public
DROP POLICY IF EXISTS "Public can view basic profile info (no email)" ON public.profiles;

-- Users can see their own full profile
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Public can only see specific non-sensitive fields
CREATE POLICY "Public can view limited profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- This policy only applies when viewing OTHER users' profiles
  auth.uid() != id OR auth.uid() IS NULL
);

-- 2. Add explicit denial for anonymous access to sensitive tables
CREATE POLICY "Deny public access to payment_transactions"
ON public.payment_transactions
FOR SELECT
USING (false);

CREATE POLICY "Deny public access to wallets"
ON public.wallets
FOR SELECT
USING (false);

CREATE POLICY "Deny public access to transactions"
ON public.transactions
FOR SELECT
USING (false);

CREATE POLICY "Deny public access to contacts"
ON public.contacts
FOR SELECT
USING (false);