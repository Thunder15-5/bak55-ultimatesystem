
-- ============================================
-- 1. Withdrawal Configuration (Admin-controlled thresholds)
-- ============================================
CREATE TABLE public.withdrawal_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.withdrawal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage withdrawal_config"
ON public.withdrawal_config FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read withdrawal_config"
ON public.withdrawal_config FOR SELECT TO authenticated
USING (true);

-- Insert default configuration
INSERT INTO public.withdrawal_config (config_key, config_value, description) VALUES
('min_withdrawal', '{"amount": 250}', 'Minimum BAKCoins required to withdraw'),
('processing_time', '{"min_hours": 24, "max_hours": 72}', 'Withdrawal processing window'),
('escrow_period', '{"days": 7}', 'Competition earnings escrow hold period'),
('activity_thresholds', '{"min_followers": 100, "min_streams": 1000}', 'Activity thresholds for withdrawal eligibility'),
('kyc_required', '{"enabled": true}', 'KYC verification required before payout');

-- ============================================
-- 2. KYC Verifications
-- ============================================
CREATE TABLE public.kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  full_legal_name text,
  id_type text,
  id_number_hash text,
  document_url text,
  selfie_url text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
ON public.kyc_verifications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own KYC"
ON public.kyc_verifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC"
ON public.kyc_verifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update any KYC"
ON public.kyc_verifications FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- ============================================
-- 3. Competition Escrow
-- ============================================
CREATE TABLE public.competition_escrow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  competition_id uuid NOT NULL REFERENCES public.competitions(id),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'held',
  hold_until timestamptz NOT NULL,
  released_at timestamptz,
  fraud_review_status text DEFAULT 'pending',
  fraud_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.competition_escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own escrow"
ON public.competition_escrow FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage escrow"
ON public.competition_escrow FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 4. Artist Level Configuration
-- ============================================
CREATE TABLE public.artist_level_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number integer NOT NULL UNIQUE,
  level_name text NOT NULL,
  min_streams integer NOT NULL DEFAULT 0,
  min_followers integer NOT NULL DEFAULT 0,
  requires_kyc boolean NOT NULL DEFAULT false,
  can_withdraw boolean NOT NULL DEFAULT false,
  perks jsonb DEFAULT '[]'::jsonb,
  badge_icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.artist_level_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist levels"
ON public.artist_level_config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage artist levels"
ON public.artist_level_config FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.artist_level_config (level_number, level_name, min_streams, min_followers, requires_kyc, can_withdraw, perks, badge_icon) VALUES
(1, 'New Artist', 0, 0, false, false, '["Basic profile", "Upload music", "Join competitions"]', '🎵'),
(2, 'Rising Artist', 500, 50, false, true, '["Basic analytics", "Limited withdrawals", "Profile badge"]', '⭐'),
(3, 'Verified Artist', 2000, 200, true, true, '["Full analytics", "Unlimited withdrawals", "Verified badge", "Priority support"]', '✅'),
(4, 'Superstar Artist', 10000, 500, true, true, '["Priority promotion", "Advanced analytics", "Featured placement", "Custom branding"]', '👑');

-- Add level_override to artist_profiles
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS level_override integer;

-- ============================================
-- 5. Fan Club Tiers
-- ============================================
CREATE TABLE public.fan_club_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.profiles(id),
  tier_name text NOT NULL,
  tier_level integer NOT NULL DEFAULT 1,
  price_bak numeric NOT NULL DEFAULT 10,
  description text,
  perks jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.fan_club_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fan club tiers"
ON public.fan_club_tiers FOR SELECT
USING (is_active = true);

CREATE POLICY "Artists can manage own tiers"
ON public.fan_club_tiers FOR ALL TO authenticated
USING (auth.uid() = artist_id)
WITH CHECK (auth.uid() = artist_id);

-- ============================================
-- 6. Fan Club Memberships
-- ============================================
CREATE TABLE public.fan_club_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES public.profiles(id),
  tier_id uuid NOT NULL REFERENCES public.fan_club_tiers(id),
  artist_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fan_id, tier_id)
);

ALTER TABLE public.fan_club_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
ON public.fan_club_memberships FOR SELECT TO authenticated
USING (auth.uid() = fan_id OR auth.uid() = artist_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can manage own memberships"
ON public.fan_club_memberships FOR INSERT TO authenticated
WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "Users can update own memberships"
ON public.fan_club_memberships FOR UPDATE TO authenticated
USING (auth.uid() = fan_id);

-- ============================================
-- 7. Fraud Flags
-- ============================================
CREATE TABLE public.fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  metadata jsonb,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fraud flags"
ON public.fraud_flags FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 8. Function: Calculate artist level from metrics
-- ============================================
CREATE OR REPLACE FUNCTION public.get_artist_level(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streams bigint;
  v_followers bigint;
  v_override integer;
  v_kyc_status text;
  v_level_row record;
  v_result jsonb;
BEGIN
  SELECT COALESCE(SUM(play_count), 0) INTO v_streams
  FROM tracks WHERE artist_id = p_user_id;

  SELECT COUNT(*) INTO v_followers
  FROM followers WHERE artist_id = p_user_id;

  SELECT level_override INTO v_override
  FROM artist_profiles WHERE user_id = p_user_id;

  SELECT COALESCE(status, 'none') INTO v_kyc_status
  FROM kyc_verifications WHERE user_id = p_user_id;

  IF v_override IS NOT NULL THEN
    SELECT * INTO v_level_row FROM artist_level_config WHERE level_number = v_override;
  ELSE
    SELECT * INTO v_level_row FROM artist_level_config
    WHERE min_streams <= v_streams AND min_followers <= v_followers
    ORDER BY level_number DESC LIMIT 1;
  END IF;

  IF v_level_row IS NULL THEN
    SELECT * INTO v_level_row FROM artist_level_config WHERE level_number = 1;
  END IF;

  RETURN jsonb_build_object(
    'level', v_level_row.level_number,
    'name', v_level_row.level_name,
    'badge', v_level_row.badge_icon,
    'can_withdraw', v_level_row.can_withdraw,
    'requires_kyc', v_level_row.requires_kyc,
    'perks', v_level_row.perks,
    'streams', v_streams,
    'followers', v_followers,
    'kyc_status', v_kyc_status
  );
END;
$$;

-- ============================================
-- 9. Function: Check withdrawal eligibility
-- ============================================
CREATE OR REPLACE FUNCTION public.check_withdrawal_eligibility(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_level jsonb;
  v_config jsonb;
  v_balance numeric;
  v_escrow_held numeric;
  v_min_withdrawal numeric;
  v_issues text[] := '{}';
BEGIN
  v_level := get_artist_level(p_user_id);

  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_escrow_held
  FROM competition_escrow WHERE user_id = p_user_id AND status = 'held';

  SELECT config_value->>'amount' INTO v_min_withdrawal
  FROM withdrawal_config WHERE config_key = 'min_withdrawal';
  v_min_withdrawal := COALESCE(v_min_withdrawal::numeric, 250);

  IF NOT (v_level->>'can_withdraw')::boolean THEN
    v_issues := array_append(v_issues, 'Artist level too low for withdrawals');
  END IF;

  IF (v_level->>'requires_kyc')::boolean AND (v_level->>'kyc_status') != 'approved' THEN
    v_issues := array_append(v_issues, 'KYC verification required');
  END IF;

  IF COALESCE(v_balance, 0) - v_escrow_held < v_min_withdrawal THEN
    v_issues := array_append(v_issues, 'Available balance below minimum (' || v_min_withdrawal || ' BAK)');
  END IF;

  RETURN jsonb_build_object(
    'eligible', array_length(v_issues, 1) IS NULL,
    'issues', to_jsonb(v_issues),
    'balance', COALESCE(v_balance, 0),
    'escrow_held', v_escrow_held,
    'available_balance', COALESCE(v_balance, 0) - v_escrow_held,
    'min_withdrawal', v_min_withdrawal,
    'level', v_level
  );
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_user ON public.competition_escrow(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON public.fraud_flags(status, severity);
CREATE INDEX IF NOT EXISTS idx_fan_club_memberships_fan ON public.fan_club_memberships(fan_id, status);
CREATE INDEX IF NOT EXISTS idx_fan_club_memberships_artist ON public.fan_club_memberships(artist_id);
CREATE INDEX IF NOT EXISTS idx_fan_club_tiers_artist ON public.fan_club_tiers(artist_id, is_active);
