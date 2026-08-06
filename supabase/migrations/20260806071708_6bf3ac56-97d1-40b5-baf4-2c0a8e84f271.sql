CREATE OR REPLACE FUNCTION public.renew_fan_club_membership(p_membership_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership public.fan_club_memberships%ROWTYPE;
  v_tier public.fan_club_tiers%ROWTYPE;
  v_fan_wallet public.wallets%ROWTYPE;
  v_artist_wallet public.wallets%ROWTYPE;
  v_price numeric;
  v_artist_share numeric;
  v_expiry timestamptz;
BEGIN
  IF auth.uid() IS NOT NULL OR current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service access required');
  END IF;

  SELECT * INTO v_membership FROM public.fan_club_memberships WHERE id = p_membership_id FOR UPDATE;
  IF NOT FOUND OR v_membership.status <> 'active' OR NOT COALESCE(v_membership.auto_renew, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Membership is not renewable');
  END IF;

  SELECT * INTO v_tier FROM public.fan_club_tiers WHERE id = v_membership.tier_id AND is_active = true;
  IF NOT FOUND THEN
    UPDATE public.fan_club_memberships SET status = 'expired' WHERE id = p_membership_id;
    RETURN jsonb_build_object('success', false, 'error', 'Tier is unavailable');
  END IF;

  v_price := round(v_tier.price_bak::numeric, 2);
  v_artist_share := round(v_price * 0.85, 2);

  SELECT * INTO v_fan_wallet FROM public.wallets WHERE user_id = v_membership.fan_id FOR UPDATE;
  IF NOT FOUND OR v_fan_wallet.balance < v_price THEN
    UPDATE public.fan_club_memberships SET status = 'expired' WHERE id = p_membership_id;
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'required', v_price);
  END IF;

  SELECT * INTO v_artist_wallet FROM public.wallets WHERE user_id = v_membership.artist_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Artist wallet not found');
  END IF;

  UPDATE public.wallets SET balance = balance - v_price, updated_at = now() WHERE id = v_fan_wallet.id;
  UPDATE public.wallets SET balance = balance + v_artist_share, updated_at = now() WHERE id = v_artist_wallet.id;

  INSERT INTO public.transactions (wallet_id, type, amount, description, reference_id)
  VALUES (v_fan_wallet.id, 'spending', -v_price, 'Fan club renewal: ' || v_tier.tier_name, p_membership_id);
  INSERT INTO public.transactions (wallet_id, type, amount, description, reference_id)
  VALUES (v_artist_wallet.id, 'earning', v_artist_share, 'Fan club renewal: ' || v_tier.tier_name || ' (85% artist share)', p_membership_id);

  v_expiry := GREATEST(v_membership.expires_at, now()) + interval '1 month';
  UPDATE public.fan_club_memberships SET expires_at = v_expiry WHERE id = p_membership_id;

  RETURN jsonb_build_object('success', true, 'expires_at', v_expiry, 'charged', v_price, 'artist_share', v_artist_share);
END;
$$;

REVOKE ALL ON FUNCTION public.renew_fan_club_membership(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.renew_fan_club_membership(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.renew_fan_club_membership(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.renew_fan_club_membership(uuid) TO service_role;