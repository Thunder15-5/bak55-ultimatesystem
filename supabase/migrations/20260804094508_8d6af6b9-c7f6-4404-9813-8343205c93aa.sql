-- Complete a payout (admin marks money as actually sent)
CREATE OR REPLACE FUNCTION public.admin_complete_withdrawal(
  p_task_id uuid,
  p_admin_id uuid,
  p_mpesa_receipt text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task admin_tasks%ROWTYPE;
  v_tx transactions%ROWTYPE;
  v_user uuid;
BEGIN
  IF NOT is_admin(p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'forbidden', 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_task FROM admin_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'error', 'Task not found');
  END IF;
  IF v_task.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed', 'error', 'Task already ' || v_task.status);
  END IF;

  SELECT * INTO v_tx FROM transactions WHERE id = v_task.related_id FOR UPDATE;
  IF FOUND THEN
    IF COALESCE(v_tx.metadata->>'status', '') = 'paid' THEN
      RETURN jsonb_build_object('success', false, 'code', 'already_processed', 'error', 'Withdrawal already paid');
    END IF;
    UPDATE transactions
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'status', 'paid',
             'paid_at', now(),
             'paid_by', p_admin_id,
             'mpesa_receipt', p_mpesa_receipt
           ),
           mpesa_receipt_number = COALESCE(p_mpesa_receipt, mpesa_receipt_number)
     WHERE id = v_tx.id;
  END IF;

  UPDATE admin_tasks
     SET status = 'completed', completed_at = now(), completed_by = p_admin_id
   WHERE id = p_task_id;

  v_user := NULLIF(v_task.metadata->>'user_id', '')::uuid;
  IF v_user IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, priority, category)
    VALUES (
      v_user, 'withdrawal_completed', 'Payout Sent',
      'Your payout of ' || COALESCE(v_task.metadata->>'net_amount', '') || ' BAK has been sent via M-Pesa.',
      '/wallet', 'high', 'payment'
    );
  END IF;

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    p_admin_id, 'withdrawal_completed', 'payment',
    'Payout completed for task ' || p_task_id,
    jsonb_build_object('task_id', p_task_id, 'target_user_id', v_user, 'mpesa_receipt', p_mpesa_receipt)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_complete_withdrawal(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_complete_withdrawal(uuid, uuid, text) TO service_role;

-- Fail a payout and refund the artist atomically
CREATE OR REPLACE FUNCTION public.admin_fail_withdrawal(
  p_task_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT 'Payout could not be completed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task admin_tasks%ROWTYPE;
  v_tx transactions%ROWTYPE;
  v_refund numeric;
  v_user uuid;
  v_wallet wallets%ROWTYPE;
BEGIN
  IF NOT is_admin(p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'forbidden', 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_task FROM admin_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'error', 'Task not found');
  END IF;
  IF v_task.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed', 'error', 'Task already ' || v_task.status);
  END IF;

  SELECT * INTO v_tx FROM transactions WHERE id = v_task.related_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'error', 'Withdrawal transaction not found');
  END IF;
  IF COALESCE(v_tx.metadata->>'status', '') IN ('paid', 'refunded') THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed', 'error', 'Withdrawal already finalised');
  END IF;

  v_refund := abs(v_tx.amount);
  SELECT * INTO v_wallet FROM wallets WHERE id = v_tx.wallet_id FOR UPDATE;
  v_user := v_wallet.user_id;

  UPDATE wallets SET balance = balance + v_refund, updated_at = now() WHERE id = v_wallet.id;

  UPDATE transactions
     SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'status', 'refunded', 'refunded_at', now(), 'refunded_by', p_admin_id, 'reason', p_reason)
   WHERE id = v_tx.id;

  INSERT INTO transactions (wallet_id, type, amount, description, reference_id, metadata)
  VALUES (v_wallet.id, 'refund', v_refund, 'Withdrawal reversed: ' || p_reason, v_tx.id,
          jsonb_build_object('type', 'withdrawal_refund', 'original_transaction', v_tx.id));

  UPDATE admin_tasks
     SET status = 'failed', completed_at = now(), completed_by = p_admin_id,
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('failure_reason', p_reason)
   WHERE id = p_task_id;

  INSERT INTO notifications (user_id, type, title, message, link, priority, category)
  VALUES (v_user, 'withdrawal_failed', 'Payout Reversed',
          p_reason || ' Your ' || v_refund || ' BAK has been returned to your wallet.',
          '/wallet', 'high', 'payment');

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (p_admin_id, 'withdrawal_failed', 'payment',
          'Payout reversed and refunded: ' || v_refund || ' BAK',
          jsonb_build_object('task_id', p_task_id, 'target_user_id', v_user, 'reason', p_reason));

  RETURN jsonb_build_object('success', true, 'refunded', v_refund);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_fail_withdrawal(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_fail_withdrawal(uuid, uuid, text) TO service_role;

-- Approve a coin purchase atomically (replaces client-side wallet writes)
CREATE OR REPLACE FUNCTION public.admin_approve_payment(
  p_transaction_id uuid,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment payment_transactions%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_bak numeric;
BEGIN
  IF NOT is_admin(p_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'forbidden', 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_payment FROM payment_transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'not_found', 'error', 'Payment not found');
  END IF;
  IF v_payment.status = 'success' THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_processed', 'error', 'Payment already approved');
  END IF;

  v_bak := round(COALESCE((v_payment.metadata->>'bak_amount')::numeric, v_payment.amount / 20.0), 2);
  IF v_bak <= 0 THEN
    RETURN jsonb_build_object('success', false, 'code', 'invalid_amount', 'error', 'Payment has no BAK value');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_payment.user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, balance) VALUES (v_payment.user_id, 0) RETURNING * INTO v_wallet;
  END IF;

  UPDATE wallets SET balance = balance + v_bak, updated_at = now() WHERE id = v_wallet.id;
  UPDATE payment_transactions SET status = 'success', updated_at = now() WHERE id = p_transaction_id;

  INSERT INTO transactions (wallet_id, type, amount, description, reference_id, metadata)
  VALUES (v_wallet.id, 'purchase', v_bak,
          'BAKCoin purchase approved (' || v_payment.amount || ' ' || COALESCE(v_payment.currency, 'KES') || ')',
          p_transaction_id,
          jsonb_build_object('provider', COALESCE(v_payment.payment_provider, 'manual'), 'payment_transaction_id', p_transaction_id));

  INSERT INTO notifications (user_id, type, title, message, link, priority, category)
  VALUES (v_payment.user_id, 'payment_success', 'BAKCoins Credited',
          v_bak || ' BAKCoins have been added to your wallet.', '/wallet', 'high', 'payment');

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (p_admin_id, 'payment_approved', 'payment',
          'Approved payment of ' || v_payment.amount || ' (' || v_bak || ' BAK)',
          jsonb_build_object('payment_transaction_id', p_transaction_id, 'target_user_id', v_payment.user_id));

  RETURN jsonb_build_object('success', true, 'credited_bak', v_bak, 'new_balance', v_wallet.balance + v_bak);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_payment(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_payment(uuid, uuid) TO service_role;