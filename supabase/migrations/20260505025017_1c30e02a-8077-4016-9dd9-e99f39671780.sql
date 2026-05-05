
-- Fraud alerts
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('artist','voter','submission','account_cluster')),
  subject_id UUID NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','snoozed','benign','escalated','resolved')),
  case_id UUID,
  assigned_to UUID,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON public.fraud_alerts(status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_subject ON public.fraud_alerts(subject_type, subject_id);
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fraud alerts" ON public.fraud_alerts
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Fraud cases
CREATE TABLE IF NOT EXISTS public.fraud_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','awaiting_approval','resolved','dismissed')),
  assigned_to UUID,
  sla_due_at TIMESTAMPTZ,
  resolution TEXT,
  resolution_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_status ON public.fraud_cases(status, severity, sla_due_at);
ALTER TABLE public.fraud_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fraud cases" ON public.fraud_cases
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Enforcement actions
CREATE TABLE IF NOT EXISTS public.enforcement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.fraud_cases(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('warn','restrict','invalidate_votes','suspend','disqualify','ban','reverse')),
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  reason_code TEXT NOT NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  before_state JSONB,
  after_state JSONB,
  proposed_by UUID NOT NULL,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','executed','reversed','rejected')),
  requires_second_admin BOOLEAN NOT NULL DEFAULT false,
  reversible_until TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enforcement_status ON public.enforcement_actions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enforcement_subject ON public.enforcement_actions(subject_type, subject_id);
ALTER TABLE public.enforcement_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage enforcement actions" ON public.enforcement_actions
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Appeals
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enforcement_action_id UUID REFERENCES public.enforcement_actions(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.fraud_cases(id) ON DELETE SET NULL,
  appellant_id UUID NOT NULL,
  statement TEXT NOT NULL,
  evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','upheld','partial_reversal','full_reversal','rejected')),
  decision_notes TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status, created_at DESC);
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage appeals" ON public.appeals
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Appellant can view own appeals" ON public.appeals
  FOR SELECT USING (appellant_id = auth.uid());
CREATE POLICY "Appellant can submit appeal" ON public.appeals
  FOR INSERT WITH CHECK (appellant_id = auth.uid());

-- Account signals (for clustering)
CREATE TABLE IF NOT EXISTS public.account_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('ip','device','payment','referrer','email_domain')),
  signal_value TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, signal_type, signal_value)
);
CREATE INDEX IF NOT EXISTS idx_signals_value ON public.account_signals(signal_type, signal_value);
CREATE INDEX IF NOT EXISTS idx_signals_user ON public.account_signals(user_id);
ALTER TABLE public.account_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read account signals" ON public.account_signals
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "System inserts account signals" ON public.account_signals
  FOR INSERT WITH CHECK (true);

-- Updated-at trigger
CREATE TRIGGER trg_fraud_alerts_updated BEFORE UPDATE ON public.fraud_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fraud_cases_updated BEFORE UPDATE ON public.fraud_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Risk scoring function
CREATE OR REPLACE FUNCTION public.compute_artist_risk_score(p_artist_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_votes INT;
  v_self_votes INT;
  v_self_ratio NUMERIC;
  v_new_voter_ratio NUMERIC;
  v_ip_concentration NUMERIC;
  v_past_actions INT;
  v_score NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_votes
  FROM votes v JOIN submissions s ON v.submission_id = s.id
  WHERE s.artist_id = p_artist_id;

  SELECT COUNT(*) INTO v_self_votes
  FROM votes v JOIN submissions s ON v.submission_id = s.id
  WHERE s.artist_id = p_artist_id AND v.voter_id = s.artist_id;

  v_self_ratio := CASE WHEN v_total_votes>0 THEN v_self_votes::numeric/v_total_votes ELSE 0 END;

  SELECT COALESCE(COUNT(*) FILTER (WHERE p.created_at > now() - interval '48 hours')::numeric
    / NULLIF(COUNT(*),0), 0)
  INTO v_new_voter_ratio
  FROM votes v JOIN submissions s ON v.submission_id = s.id
  JOIN profiles p ON p.id = v.voter_id
  WHERE s.artist_id = p_artist_id;

  SELECT COUNT(*) INTO v_past_actions
  FROM enforcement_actions
  WHERE subject_id = p_artist_id AND status = 'executed';

  v_ip_concentration := 0;

  v_score := LEAST(100, ROUND(
    (v_self_ratio * 25) +
    (v_new_voter_ratio * 20) +
    (v_ip_concentration * 25) +
    (LEAST(v_past_actions,5)::numeric/5 * 15) +
    (CASE WHEN v_total_votes>500 THEN 15 ELSE v_total_votes::numeric/500*15 END)
  ));

  RETURN jsonb_build_object(
    'score', v_score,
    'self_vote_ratio', ROUND(v_self_ratio*100,1),
    'new_voter_ratio', ROUND(v_new_voter_ratio*100,1),
    'ip_concentration', ROUND(v_ip_concentration*100,1),
    'past_enforcement', v_past_actions,
    'total_votes', v_total_votes,
    'self_votes', v_self_votes
  );
END;
$$;
