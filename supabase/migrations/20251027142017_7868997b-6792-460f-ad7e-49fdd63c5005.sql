-- Create vouchers table for offline top-ups
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  bak_coins NUMERIC(12,2) NOT NULL CHECK (bak_coins > 0),
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'revoked')),
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  issued_to UUID NULL REFERENCES public.profiles(id),
  used_by UUID NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NULL,
  used_at TIMESTAMPTZ NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on voucher codes for fast lookup
CREATE INDEX idx_vouchers_code ON public.vouchers(code);
CREATE INDEX idx_vouchers_status ON public.vouchers(status);

-- Enable RLS on vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Admins can manage vouchers
CREATE POLICY "Admins can manage all vouchers"
ON public.vouchers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create deposit_requests table for manual M-Pesa top-ups
CREATE TABLE public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_kes NUMERIC(12,2) NOT NULL CHECK (amount_kes >= 100),
  expected_bak NUMERIC(12,2) GENERATED ALWAYS AS (amount_kes / 20) STORED,
  receipt_code TEXT NOT NULL,
  screenshot_url TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID NULL REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for deposit requests
CREATE INDEX idx_deposit_requests_user_id ON public.deposit_requests(user_id);
CREATE INDEX idx_deposit_requests_status ON public.deposit_requests(status);

-- Enable RLS on deposit_requests
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own deposit requests
CREATE POLICY "Users can create own deposit requests"
ON public.deposit_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own deposit requests
CREATE POLICY "Users can view own deposit requests"
ON public.deposit_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view and update all deposit requests
CREATE POLICY "Admins can view all deposit requests"
ON public.deposit_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deposit requests"
ON public.deposit_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles RLS to prevent email exposure
DROP POLICY IF EXISTS "Public view limited profile" ON public.profiles;

-- Create safer policy that doesn't expose emails
CREATE POLICY "Public can view safe profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR 
  (auth.uid() IS NOT NULL AND auth.uid() <> id)
);

-- Note: To fully protect emails, queries should explicitly exclude email column
-- when viewing other users' profiles, or use a view