-- Add reward_type and metadata to referrals table for tiered rewards
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'signup',
ADD COLUMN IF NOT EXISTS referrer_role TEXT,
ADD COLUMN IF NOT EXISTS referred_role TEXT,
ADD COLUMN IF NOT EXISTS bonus_earned NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fraud_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fraud_reason TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at DESC);

-- Create referral_rewards_config table for admin-adjustable reward settings
CREATE TABLE IF NOT EXISTS public.referral_rewards_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type TEXT NOT NULL UNIQUE,
  description TEXT,
  fan_referrer_reward NUMERIC NOT NULL DEFAULT 2,
  artist_referrer_reward NUMERIC NOT NULL DEFAULT 5,
  referred_bonus NUMERIC NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_rewards_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_rewards_config
CREATE POLICY "Anyone can view reward config"
ON public.referral_rewards_config FOR SELECT
USING (true);

CREATE POLICY "Admins can manage reward config"
ON public.referral_rewards_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default reward configurations
INSERT INTO public.referral_rewards_config (reward_type, description, fan_referrer_reward, artist_referrer_reward, referred_bonus)
VALUES 
  ('signup', 'Reward when referred user signs up', 2, 5, 1),
  ('premium_subscription', 'Bonus when referred user subscribes to premium', 5, 10, 2),
  ('first_upload', 'Bonus when referred artist uploads first track', 0, 3, 0),
  ('first_vote', 'Bonus when referred user votes in competition', 1, 2, 0)
ON CONFLICT (reward_type) DO NOTHING;

-- Create trigger for referral notifications
CREATE OR REPLACE FUNCTION public.notify_referral_success()
RETURNS TRIGGER AS $$
DECLARE
  referrer_username TEXT;
  referred_username TEXT;
BEGIN
  -- Get usernames
  SELECT username INTO referrer_username FROM profiles WHERE id = NEW.referrer_id;
  SELECT username INTO referred_username FROM profiles WHERE id = NEW.referred_id;
  
  -- Notify referrer
  INSERT INTO notifications (user_id, type, title, message, link, priority, category)
  VALUES (
    NEW.referrer_id,
    'referral_success',
    '🎉 Referral Success!',
    'Your friend @' || referred_username || ' joined BAK55! You earned ' || NEW.reward_amount || ' BAKCoins',
    '/wallet',
    'high',
    'reward'
  );
  
  -- Notify referred user about their welcome bonus if any
  IF NEW.bonus_earned > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      NEW.referred_id,
      'referral_bonus',
      '🎁 Welcome Bonus!',
      'You received ' || NEW.bonus_earned || ' BAKCoins as a welcome gift from your referrer!',
      '/wallet',
      'high',
      'reward'
    );
  END IF;
  
  -- Log admin activity
  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    NEW.referrer_id,
    'referral_completed',
    'referral',
    'Referral completed: ' || referrer_username || ' referred ' || referred_username,
    jsonb_build_object(
      'referrer_id', NEW.referrer_id,
      'referred_id', NEW.referred_id,
      'reward_amount', NEW.reward_amount,
      'reward_type', NEW.reward_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on referral insert/update
DROP TRIGGER IF EXISTS trigger_referral_success ON public.referrals;
CREATE TRIGGER trigger_referral_success
AFTER INSERT OR UPDATE OF rewarded ON public.referrals
FOR EACH ROW
WHEN (NEW.rewarded = TRUE)
EXECUTE FUNCTION notify_referral_success();

-- Update referrals RLS policies to allow admins to manage
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));