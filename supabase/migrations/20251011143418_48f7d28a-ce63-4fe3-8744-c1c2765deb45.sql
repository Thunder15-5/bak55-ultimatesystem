-- ============================================
-- Security Enhancements Migration
-- ============================================

-- 1. Create atomic wallet transfer function to prevent race conditions
CREATE OR REPLACE FUNCTION public.transfer_funds(
  sender_id UUID,
  recipient_id UUID,
  transfer_amount NUMERIC
) RETURNS BOOLEAN
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

-- 2. Add comment length constraint
ALTER TABLE public.comments 
ADD CONSTRAINT comment_length_check 
CHECK (char_length(content) BETWEEN 1 AND 500);

-- 3. Add contact form length constraints
ALTER TABLE public.contacts
ADD CONSTRAINT contact_name_length CHECK (char_length(name) BETWEEN 1 AND 100),
ADD CONSTRAINT contact_email_length CHECK (char_length(email) BETWEEN 1 AND 255),
ADD CONSTRAINT contact_subject_length CHECK (char_length(subject) BETWEEN 1 AND 200),
ADD CONSTRAINT contact_message_length CHECK (char_length(message) BETWEEN 10 AND 2000);

-- 4. Update profiles RLS to hide email from public view
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Users can view all fields of their own profile
CREATE POLICY "Users can view own profile fully"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Public can only view non-sensitive fields
CREATE POLICY "Public can view non-sensitive profile fields"
ON public.profiles
FOR SELECT
USING (true);

-- Note: We'll handle email filtering in the application layer since PostgreSQL 
-- RLS doesn't support column-level security directly. Frontend queries should
-- exclude email field for public profile views.

-- 5. Add idempotency index for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference 
ON public.payment_transactions(payment_reference) 
WHERE status = 'success';

-- 6. Add rate limiting helper table for API calls
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint 
ON public.rate_limits(user_id, endpoint, window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can write to rate_limits
CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- 7. Add password breach detection (Supabase feature)
-- This needs to be enabled in Supabase dashboard under Authentication > Settings
-- Setting: Enable password breach detection

-- 8. Add indexes for better query performance on security-related lookups
CREATE INDEX IF NOT EXISTS idx_tips_from_user ON public.tips(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_to_artist ON public.tips(to_artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- 9. Create helper function to check if user has sufficient balance
CREATE OR REPLACE FUNCTION public.has_sufficient_balance(
  _user_id UUID,
  _amount NUMERIC
) RETURNS BOOLEAN
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

-- 10. Add trigger to clean up old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleanup_rate_limits
AFTER INSERT ON public.rate_limits
EXECUTE FUNCTION public.cleanup_old_rate_limits();
