-- 1. Config: platform wallet owner + withdrawal economics
INSERT INTO public.withdrawal_config (config_key, config_value, description)
VALUES
  ('platform_user_id', '{"user_id": "b2a31558-e58a-466f-99b8-7ba636bcf6be"}'::jsonb, 'Owner of the BAK55 platform operations wallet'),
  ('fee_percent', '{"percent": 5}'::jsonb, 'Withdrawal fee percentage'),
  ('max_withdrawal', '{"amount": 50000}'::jsonb, 'Maximum single withdrawal in BAK'),
  ('daily_limit', '{"amount": 100000}'::jsonb, 'Maximum BAK withdrawn per user per day')
ON CONFLICT (config_key) DO NOTHING;

-- 2. Prevent receipt-code reuse on manual deposits
CREATE UNIQUE INDEX IF NOT EXISTS uniq_deposit_receipt_active
  ON public.deposit_requests (lower(btrim(receipt_code)))
  WHERE status <> 'rejected';

-- 3. Performance indexes on the money read paths
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created
  ON public.transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_type
  ON public.transactions (wallet_id, type);

-- 4. Atomic withdrawal request
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_user_id uuid,
  p_amount numeric,
  p_phone text,
  p_bank_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_platform_wallet wallets%ROWTYPE;
  v_platform_user uuid;
  v_min numeric;
  v_max numeric;
  v_daily_limit numeric;
  v_fee_pct numeric;
  v_amount numeric;
  v_fee numeric;
  v_net numeric;
  v_eligibility jsonb;
  v_daily_total numeric;
  v_pending int;
  v_reference text;
  v_tx_id uuid;
BEGIN
  v_amount := round(COALESCE(p_amount, 0)::numeric, 2);

  SELECT (config_value->>'user_id')::uuid INTO v_platform_user
    FROM withdrawal_config WHERE config_key = 'platform_user_id';
  SELECT COALESCE((config_value->>'amount')::numeric, 250) INTO v_min
    FROM withdrawal_config WHERE config_key = 'min_withdrawal';
  SELECT COALESCE((config_value->>'amount')::numeric, 50000) INTO v_max
    FROM withdrawal_config WHERE config_key = 'max_withdrawal';
  SELECT COALESCE((config_value->>'amount')::numeric, 100000) INTO v_daily_limit
    FROM withdrawal_config WHERE config_key = 'daily_limit';
  SELECT COALESCE((config_value->>'percent')::numeric, 5) INTO v_fee_pct
    FROM withdrawal_config WHERE config_key = 'fee_percent';

  IF v_platform_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'config_error', 'error', 'Platform wallet not configured');
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_amount', 'error', 'Invalid withdrawal amount');
  END IF;
  IF v_amount < v_min THEN
    RETURN jsonb_build_object('success', false, 'code', 'below_minimum', 'error', 'Minimum withdrawal is ' || v_min || ' BAK');
  END IF;
  IF v_amount > v_max THEN
    RETURN jsonb_build_object('success', false, 'code', 'above_maximum', 'error', 'Maximum withdrawal is ' || v_max || ' BAK');
  END IF;

  -- Server-side eligibility (artist level, KYC, escrow-adjusted balance)
  v_eligibility := check_withdrawal_eligibility(p_user_id);
  IF NOT (v_eligibility->>'eligible')::boolean THEN
    RETURN jsonb_build_object(
      'success', false, 'code', 'not_eligible',
      'error', 'Not eligible for withdrawal',
      'issues', v_eligibility->'issues'
    );
  END IF;

  -- Lock both wallets in deterministic id order to avoid deadlocks
  PERFORM id FROM wallets
   WHERE user_id IN (p_user_id, v_platform_user)
   ORDER BY id
     FOR UPDATE;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'no_wallet', 'error', 'Wallet not found');
  END IF;

  SELECT * INTO v_platform_wallet FROM wallets WHERE user_id = v_platform_user;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'config_error', 'error', 'Platform wallet not found');
  END IF;

  -- One open withdrawal at a time
  SELECT count(*) INTO v_pending
    FROM transactions
   WHERE wallet_id = v_wallet.id
     AND type = 'withdrawal'
     AND COALESCE(metadata->>'status', 'processing') IN ('pending', 'processing', 'pending_manual');
  IF v_pending > 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'pending_exists',
      'error', 'You already have a withdrawal in progress. Please wait for it to complete.');
  END IF;

  -- Daily limit (absolute value of withdrawal rows today)
  SELECT COALESCE(SUM(abs(amount)), 0) INTO v_daily_total
    FROM transactions
   WHERE wallet_id = v_wallet.id
     AND type = 'withdrawal'
     AND created_at >= date_trunc('day', now());
  IF v_daily_total + v_amount > v_daily_limit THEN
    RETURN jsonb_build_object('success', false, 'code', 'daily_limit',
      'error', 'Daily withdrawal limit of ' || v_daily_limit || ' BAK exceeded');
  END IF;

  IF v_wallet.balance < v_amount THEN
    RETURN jsonb_build_object('success', false, 'code', 'insufficient_funds',
      'error', 'Insufficient balance', 'balance', v_wallet.balance);
  END IF;

  v_fee := round(v_amount * v_fee_pct / 100.0, 2);
  v_net := v_amount - v_fee;
  v_reference := 'WDL-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substring(p_user_id::text, 1, 8);

  UPDATE wallets SET balance = balance - v_amount, updated_at = now() WHERE id = v_wallet.id;
  UPDATE wallets SET balance = balance + v_fee, updated_at = now() WHERE id = v_platform_wallet.id;

  INSERT INTO transactions (wallet_id, type, amount, withdrawal_fee, description, mpesa_phone_number, metadata)
  VALUES (
    v_wallet.id, 'withdrawal', -v_amount, v_fee,
    'Withdrawal to ' || p_phone, p_phone,
    jsonb_build_object(
      'status', 'pending_manual',
      'reference', v_reference,
      'gross_amount', v_amount,
      'fee', v_fee,
      'net_amount', v_net,
      'fee_percent', v_fee_pct,
      'bank_details', COALESCE(p_bank_details, '{}'::jsonb)
    )
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO transactions (wallet_id, type, amount, description, reference_id, metadata)
  VALUES (
    v_platform_wallet.id, 'earning', v_fee,
    'Withdrawal fee (' || v_fee_pct || '% of ' || v_amount || ' BAK)',
    v_tx_id,
    jsonb_build_object('type', 'withdrawal_fee', 'user_id', p_user_id, 'gross_amount', v_amount, 'fee_percent', v_fee_pct)
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'reference', v_reference,
    'gross_amount', v_amount,
    'fee', v_fee,
    'net_amount', v_net,
    'new_balance', v_wallet.balance - v_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(uuid, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(uuid, numeric, text, jsonb) TO service_role;

-- 5. Atomic, idempotent deposit approval
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_req deposit_requests%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_bak numeric;
  v_tx_id uuid;
BEGIN
  IF NOT is_admin(p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'forbidden', 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_req FROM deposit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'error', 'Deposit request not found');
  END IF;
  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed',
      'error', 'Request already ' || v_req.status);
  END IF;

  v_bak := round(COALESCE(v_req.expected_bak, 0)::numeric, 2);
  IF v_bak <= 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_amount', 'error', 'Deposit has no BAK value');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_req.user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, balance) VALUES (v_req.user_id, 0)
    RETURNING * INTO v_wallet;
  END IF;

  UPDATE wallets SET balance = balance + v_bak, updated_at = now() WHERE id = v_wallet.id;

  INSERT INTO transactions (wallet_id, type, amount, description, reference_id, metadata)
  VALUES (
    v_wallet.id, 'income', v_bak,
    'Manual M-Pesa deposit: ' || v_req.amount_kes || ' KSh',
    p_request_id,
    jsonb_build_object('provider', 'manual_mpesa', 'receipt_code', v_req.receipt_code, 'deposit_request_id', p_request_id)
  )
  RETURNING id INTO v_tx_id;

  UPDATE deposit_requests
     SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = now(), notes = p_notes
   WHERE id = p_request_id;

  INSERT INTO notifications (user_id, type, title, message, link, priority, category)
  VALUES (
    v_req.user_id, 'deposit_approved', 'Deposit Approved',
    v_bak || ' BAKCoins have been credited to your wallet.', '/wallet', 'high', 'payment'
  );

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    p_admin_id, 'deposit_approved', 'payment',
    'Approved deposit of ' || v_req.amount_kes || ' KSh (' || v_bak || ' BAK)',
    jsonb_build_object('deposit_request_id', p_request_id, 'target_user_id', v_req.user_id, 'bak', v_bak)
  );

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'credited_bak', v_bak,
    'new_balance', v_wallet.balance + v_bak);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_deposit_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_deposit_request(uuid, uuid, text) TO service_role;

-- 6. Reject deposit (audited, idempotent)
CREATE OR REPLACE FUNCTION public.reject_deposit_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_req deposit_requests%ROWTYPE;
BEGIN
  IF NOT is_admin(p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'forbidden', 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_req FROM deposit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'error', 'Deposit request not found');
  END IF;
  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed',
      'error', 'Request already ' || v_req.status);
  END IF;

  UPDATE deposit_requests
     SET status = 'rejected', reviewed_by = p_admin_id, reviewed_at = now(), notes = p_notes
   WHERE id = p_request_id;

  INSERT INTO notifications (user_id, type, title, message, link, priority, category)
  VALUES (
    v_req.user_id, 'deposit_rejected', 'Deposit Rejected',
    COALESCE(p_notes, 'Your deposit request could not be verified.'), '/wallet', 'high', 'payment'
  );

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    p_admin_id, 'deposit_rejected', 'payment',
    'Rejected deposit of ' || v_req.amount_kes || ' KSh',
    jsonb_build_object('deposit_request_id', p_request_id, 'target_user_id', v_req.user_id, 'reason', p_notes)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reject_deposit_request(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit_request(uuid, uuid, text) TO service_role;