
-- 1. Create secure wallet deduction RPC with row-level locking
CREATE OR REPLACE FUNCTION public.deduct_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_tx_id uuid;
BEGIN
  -- Lock the wallet row to prevent concurrent modifications
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', v_wallet.balance);
  END IF;

  -- Deduct
  UPDATE wallets SET balance = balance - p_amount WHERE id = v_wallet.id;

  -- Record transaction
  INSERT INTO transactions (wallet_id, type, amount, description, reference_id)
  VALUES (v_wallet.id, 'competition_fee', -p_amount, COALESCE(p_description, 'Wallet deduction'), p_reference_id)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_wallet.balance - p_amount,
    'transaction_id', v_tx_id
  );
END;
$$;

-- 2. Fix RLS conflicts: Drop conflicting RESTRICTIVE deny policies
-- contacts: "Deny public access" blocks even admins since all policies are RESTRICTIVE
DROP POLICY IF EXISTS "Deny public access to contacts" ON contacts;

-- payment_transactions: same issue
DROP POLICY IF EXISTS "Deny public access to payment_transactions" ON payment_transactions;

-- transactions: same issue  
DROP POLICY IF EXISTS "Deny public access to transactions" ON transactions;

-- 3. Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_fan_activities_user_id ON fan_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON track_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_submission_id ON votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_artist_id ON followers(artist_id);
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_id ON submissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_comments_track_id ON comments(track_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
