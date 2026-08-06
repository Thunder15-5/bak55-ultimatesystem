CREATE OR REPLACE FUNCTION public.subscribe_fan_club(p_tier_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fan_id uuid := auth.uid();
  v_tier public.fan_club_tiers%ROWTYPE;
  v_fan_wallet public.wallets%ROWTYPE;
  v_artist_wallet public.wallets%ROWTYPE;
  v_existing public.fan_club_memberships%ROWTYPE;
  v_price numeric;
  v_artist_share numeric;
  v_expiry timestamptz;
  v_membership_id uuid;
BEGIN
  IF v_fan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT * INTO v_tier
  FROM public.fan_club_tiers
  WHERE id = p_tier_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fan club tier is unavailable');
  END IF;

  IF v_tier.artist_id = v_fan_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot subscribe to your own fan club');
  END IF;

  v_price := round(v_tier.price_bak::numeric, 2);
  IF v_price < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fan club tiers must cost at least 10 BAK');
  END IF;
  v_artist_share := round(v_price * 0.85, 2);

  SELECT * INTO v_existing
  FROM public.fan_club_memberships
  WHERE fan_id = v_fan_id AND tier_id = p_tier_id
  FOR UPDATE;

  IF FOUND AND v_existing.status = 'active' AND v_existing.expires_at > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This membership is already active');
  END IF;

  SELECT * INTO v_fan_wallet
  FROM public.wallets
  WHERE user_id = v_fan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fan wallet not found');
  END IF;
  IF v_fan_wallet.balance < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'required', v_price, 'balance', v_fan_wallet.balance);
  END IF;

  SELECT * INTO v_artist_wallet
  FROM public.wallets
  WHERE user_id = v_tier.artist_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Artist wallet not found');
  END IF;

  UPDATE public.wallets SET balance = balance - v_price, updated_at = now() WHERE id = v_fan_wallet.id;
  UPDATE public.wallets SET balance = balance + v_artist_share, updated_at = now() WHERE id = v_artist_wallet.id;

  INSERT INTO public.transactions (wallet_id, type, amount, description, reference_id)
  VALUES (v_fan_wallet.id, 'spending', -v_price, 'Fan club: ' || v_tier.tier_name, p_tier_id);

  INSERT INTO public.transactions (wallet_id, type, amount, description, reference_id)
  VALUES (v_artist_wallet.id, 'earning', v_artist_share, 'Fan club: ' || v_tier.tier_name || ' (85% artist share)', p_tier_id);

  v_expiry := now() + interval '1 month';

  INSERT INTO public.fan_club_memberships (fan_id, tier_id, artist_id, status, started_at, expires_at, auto_renew)
  VALUES (v_fan_id, p_tier_id, v_tier.artist_id, 'active', now(), v_expiry, true)
  ON CONFLICT (fan_id, tier_id) DO UPDATE
  SET artist_id = EXCLUDED.artist_id,
      status = 'active',
      started_at = now(),
      expires_at = EXCLUDED.expires_at,
      auto_renew = true
  RETURNING id INTO v_membership_id;

  RETURN jsonb_build_object(
    'success', true,
    'membership_id', v_membership_id,
    'expires_at', v_expiry,
    'charged', v_price,
    'artist_share', v_artist_share,
    'new_balance', v_fan_wallet.balance - v_price
  );
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_fan_club(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_fan_club(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_fan_club(uuid) TO service_role;