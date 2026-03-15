-- ============================================
-- BAK55 CORE PLATFORM SECURITY HARDENING
-- ============================================

-- 1. FIX CRITICAL: Restrict profiles SELECT policy to prevent PII leakage
DROP POLICY IF EXISTS "Public can view safe profile fields" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. FIX: Restrict votes table - only authenticated can read
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON votes;

CREATE POLICY "Authenticated users can view votes"
ON votes FOR SELECT
TO authenticated
USING (true);

-- 3. FIX: Restrict producer contact_email from anonymous users
DROP POLICY IF EXISTS "Producer profiles are viewable by everyone" ON producer_profiles;

CREATE POLICY "Producer profiles viewable by authenticated"
ON producer_profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Add vote audit table for tracking suspicious patterns
CREATE TABLE IF NOT EXISTS vote_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  is_self_vote boolean DEFAULT false,
  vote_number_in_session int DEFAULT 1,
  flagged boolean DEFAULT false,
  flag_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vote_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vote audit"
ON vote_audit_log FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit"
ON vote_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Add account suspension tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by uuid;

-- 6. Create vote integrity analysis function
CREATE OR REPLACE FUNCTION public.get_competition_vote_analysis(comp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_votes', (SELECT COUNT(*) FROM votes v JOIN submissions s ON v.submission_id = s.id WHERE s.competition_id = comp_id),
    'unique_voters', (SELECT COUNT(DISTINCT v.voter_id) FROM votes v JOIN submissions s ON v.submission_id = s.id WHERE s.competition_id = comp_id),
    'self_votes', (SELECT COUNT(*) FROM votes v JOIN submissions s ON v.submission_id = s.id WHERE s.competition_id = comp_id AND v.voter_id = s.artist_id),
    'fan_votes', (SELECT COUNT(*) FROM votes v JOIN submissions s ON v.submission_id = s.id WHERE s.competition_id = comp_id AND v.voter_id != s.artist_id),
    'self_vote_percentage', ROUND(
      (SELECT COUNT(*)::numeric FROM votes v JOIN submissions s ON v.submission_id = s.id WHERE s.competition_id = comp_id AND v.voter_id = s.artist_id) /
      NULLIF((SELECT COUNT(*)::numeric FROM votes v JOIN submissions s ON v.submission_id = s.id WHERE s.competition_id = comp_id), 0) * 100, 2
    ),
    'top_voters', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT v.voter_id, p.username, COUNT(*) as votes_cast,
          SUM(CASE WHEN v.voter_id = s.artist_id THEN 1 ELSE 0 END) as self_votes
        FROM votes v JOIN submissions s ON v.submission_id = s.id JOIN profiles p ON p.id = v.voter_id
        WHERE s.competition_id = comp_id GROUP BY v.voter_id, p.username ORDER BY votes_cast DESC LIMIT 20
      ) t
    ),
    'submissions_by_votes', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT s.id, s.title, s.vote_count, s.artist_id, p.username,
          (SELECT COUNT(*) FROM votes v WHERE v.submission_id = s.id AND v.voter_id = s.artist_id) as self_votes,
          (SELECT COUNT(*) FROM votes v WHERE v.submission_id = s.id AND v.voter_id != s.artist_id) as genuine_votes
        FROM submissions s JOIN profiles p ON p.id = s.artist_id
        WHERE s.competition_id = comp_id ORDER BY s.vote_count DESC
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- 7. Create admin function to invalidate suspicious votes
CREATE OR REPLACE FUNCTION public.admin_invalidate_votes(
  p_voter_id uuid,
  p_submission_id uuid DEFAULT NULL,
  p_reason text DEFAULT 'Administrative action'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_count int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF p_submission_id IS NOT NULL THEN
    DELETE FROM votes WHERE voter_id = p_voter_id AND submission_id = p_submission_id;
  ELSE
    DELETE FROM votes WHERE voter_id = p_voter_id;
  END IF;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    auth.uid(), 'votes_invalidated', 'moderation',
    'Invalidated ' || v_deleted_count || ' votes. Reason: ' || p_reason,
    jsonb_build_object('voter_id', p_voter_id, 'submission_id', p_submission_id, 'votes_removed', v_deleted_count)
  );

  RETURN jsonb_build_object('success', true, 'votes_removed', v_deleted_count);
END;
$$;

-- 8. Create admin function to suspend users
CREATE OR REPLACE FUNCTION public.admin_suspend_user(
  p_target_user_id uuid,
  p_reason text DEFAULT 'Violation of platform rules'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  UPDATE profiles 
  SET banned = true, suspended_at = now(), suspension_reason = p_reason, suspended_by = auth.uid()
  WHERE id = p_target_user_id;

  INSERT INTO admin_activity_log (user_id, event_type, event_category, description, metadata)
  VALUES (
    auth.uid(), 'user_suspended', 'moderation', 'User suspended: ' || p_reason,
    jsonb_build_object('target_user_id', p_target_user_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;