-- transfer_funds: enforce caller ownership
CREATE OR REPLACE FUNCTION public.transfer_funds(sender_id uuid, recipient_id uuid, transfer_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_sender_wallet wallets%ROWTYPE;
  v_recipient_wallet wallets%ROWTYPE;
  v_amount numeric := round(COALESCE(transfer_amount, 0)::numeric, 2);
BEGIN
  -- Only the owner (or a trusted server/admin context) may move funds
  IF v_caller IS NOT NULL AND v_caller <> sender_id AND NOT is_admin(v_caller) THEN
    RAISE EXCEPTION 'Not authorized to transfer from this wallet';
  END IF;
  IF v_caller IS NULL AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;
  IF sender_id = recipient_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same wallet';
  END IF;

  PERFORM id FROM wallets WHERE user_id IN (sender_id, recipient_id) ORDER BY id FOR UPDATE;

  SELECT * INTO v_sender_wallet FROM wallets WHERE user_id = sender_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sender wallet not found'; END IF;

  SELECT * INTO v_recipient_wallet FROM wallets WHERE user_id = recipient_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recipient wallet not found'; END IF;

  IF v_sender_wallet.balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE wallets SET balance = balance - v_amount, updated_at = now() WHERE id = v_sender_wallet.id;
  UPDATE wallets SET balance = balance + v_amount, updated_at = now() WHERE id = v_recipient_wallet.id;

  RETURN true;
END;
$$;

-- deduct_wallet: enforce caller ownership
CREATE OR REPLACE FUNCTION public.deduct_wallet(
  p_user_id uuid, p_amount numeric, p_description text DEFAULT NULL, p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_wallet wallets%ROWTYPE;
  v_tx_id uuid;
  v_amount numeric := round(COALESCE(p_amount, 0)::numeric, 2);
BEGIN
  IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT is_admin(v_caller) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this wallet');
  END IF;
  IF v_caller IS NULL AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF v_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.balance < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', v_wallet.balance);
  END IF;

  UPDATE wallets SET balance = balance - v_amount, updated_at = now() WHERE id = v_wallet.id;

  INSERT INTO transactions (wallet_id, type, amount, description, reference_id)
  VALUES (v_wallet.id, 'competition_fee', -v_amount, COALESCE(p_description, 'Wallet deduction'), p_reference_id)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_wallet.balance - v_amount, 'transaction_id', v_tx_id);
END;
$$;

-- Eligibility lookups: self or admin only
CREATE OR REPLACE FUNCTION public.check_withdrawal_eligibility(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_level jsonb;
  v_balance numeric;
  v_escrow_held numeric;
  v_min_withdrawal numeric;
  v_issues text[] := '{}';
BEGIN
  IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT is_admin(v_caller) THEN
    RETURN jsonb_build_object('eligible', false, 'issues', to_jsonb(ARRAY['Not authorized']));
  END IF;

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

-- Remove anonymous execute on privileged money/admin functions
REVOKE EXECUTE ON FUNCTION public.transfer_funds(uuid, uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_wallet(uuid, numeric, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_withdrawal_eligibility(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_suspend_user(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_invalidate_votes(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.settle_amplify_campaign(uuid) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.transfer_funds(uuid, uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_wallet(uuid, numeric, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_withdrawal_eligibility(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.settle_amplify_campaign(uuid) TO service_role;