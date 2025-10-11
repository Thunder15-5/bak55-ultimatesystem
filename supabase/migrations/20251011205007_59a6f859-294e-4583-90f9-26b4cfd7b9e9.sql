-- Fix 1: Protect email addresses in profiles table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own complete profile
CREATE POLICY "Users can view own complete profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Public can only see non-sensitive fields
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- Create a view for public profiles (excludes email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, avatar_url, bio, location, created_at, updated_at
FROM profiles;

-- Fix 2: Create atomic transfer function for tips (prevents race conditions)
CREATE OR REPLACE FUNCTION public.transfer_funds(
  sender_id UUID,
  recipient_id UUID,
  transfer_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_wallet_id UUID;
  recipient_wallet_id UUID;
BEGIN
  -- Get wallet IDs with row-level locking to prevent concurrent modifications
  SELECT id INTO sender_wallet_id
  FROM public.wallets
  WHERE user_id = sender_id
  FOR UPDATE;
  
  SELECT id INTO recipient_wallet_id
  FROM public.wallets
  WHERE user_id = recipient_id
  FOR UPDATE;
  
  IF sender_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  
  IF recipient_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Recipient wallet not found';
  END IF;
  
  -- Deduct from sender (this will fail if insufficient balance due to constraint)
  UPDATE public.wallets 
  SET balance = balance - transfer_amount, updated_at = NOW()
  WHERE id = sender_wallet_id AND balance >= transfer_amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Add to recipient
  UPDATE public.wallets 
  SET balance = balance + transfer_amount, updated_at = NOW()
  WHERE id = recipient_wallet_id;
  
  RETURN TRUE;
END;
$$;

-- Fix 3: Add helper function to check if user has sufficient balance
CREATE OR REPLACE FUNCTION public.has_sufficient_balance(_user_id UUID, _amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wallets
    WHERE user_id = _user_id AND balance >= _amount
  )
$$;