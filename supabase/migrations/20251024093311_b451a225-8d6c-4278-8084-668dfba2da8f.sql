-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price_bak NUMERIC NOT NULL DEFAULT 0,
  price_kes NUMERIC NOT NULL DEFAULT 0,
  upload_limit INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled', 'pending')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  payment_method TEXT DEFAULT 'bakcoins',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription transactions table
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BAK',
  status TEXT NOT NULL DEFAULT 'completed',
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_transactions
CREATE POLICY "Users can view own subscription transactions" ON public.subscription_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription transactions" ON public.subscription_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription transactions" ON public.subscription_transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON public.user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON public.subscription_transactions(user_id);

-- Seed default subscription plans
INSERT INTO public.subscription_plans (name, price_bak, price_kes, upload_limit, features, is_active) VALUES
  ('Artist Free', 0, 0, 1, 
   '["1 track upload", "Basic analytics", "Standard support", "Competition entry"]'::jsonb, 
   true),
  ('Artist Pro', 200, 4000, NULL, 
   '["Unlimited uploads", "Advanced analytics", "Priority moderation (24hr)", "50% off entry fees", "Verified badge"]'::jsonb, 
   true),
  ('Artist Premium', 500, 10000, NULL, 
   '["All Pro features", "Featured placement", "Free competition entries (5/month)", "Custom URL", "Early access", "Dedicated support"]'::jsonb, 
   true)
ON CONFLICT (name) DO NOTHING;

-- Update can_user_upload_track function to check subscriptions
CREATE OR REPLACE FUNCTION public.can_user_upload_track(user_id_param UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  approved_count INTEGER;
  total_count INTEGER;
  has_active_subscription BOOLEAN;
  subscription_plan_name TEXT;
BEGIN
  -- Count approved tracks
  SELECT COUNT(*) INTO approved_count
  FROM tracks
  WHERE artist_id = user_id_param AND moderation_status = 'approved';
  
  -- Count total tracks
  SELECT COUNT(*) INTO total_count
  FROM tracks
  WHERE artist_id = user_id_param;
  
  -- Check for active subscription
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_id_param 
      AND status = 'active'
      AND expires_at > NOW()
  ), 
  (SELECT sp.name FROM user_subscriptions us
   JOIN subscription_plans sp ON us.plan_id = sp.id
   WHERE us.user_id = user_id_param 
     AND us.status = 'active'
     AND us.expires_at > NOW()
   LIMIT 1)
  INTO has_active_subscription, subscription_plan_name;
  
  -- First upload is always allowed (onboarding)
  IF total_count < 1 THEN
    RETURN TRUE;
  END IF;
  
  -- Pro/Premium subscribers get unlimited uploads
  IF has_active_subscription AND subscription_plan_name IN ('Artist Pro', 'Artist Premium') THEN
    RETURN TRUE;
  END IF;
  
  -- Free tier artists can't upload more after first track
  RETURN FALSE;
END;
$$;

-- Grant existing artists with approved tracks a free 3-month Pro subscription
INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, auto_renew, payment_method)
SELECT 
  DISTINCT t.artist_id,
  (SELECT id FROM subscription_plans WHERE name = 'Artist Pro'),
  'active',
  NOW(),
  NOW() + INTERVAL '3 months',
  FALSE,
  'promotional'
FROM tracks t
WHERE t.moderation_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us 
    WHERE us.user_id = t.artist_id
  );

-- Add updated_at trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add tracking columns to early_access_signups if not exists
ALTER TABLE public.early_access_signups 
  ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS converted_user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS invited BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;