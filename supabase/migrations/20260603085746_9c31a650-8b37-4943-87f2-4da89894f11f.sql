
CREATE TABLE public.amplify_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier_id text NOT NULL,
  tier_name text NOT NULL,
  bak_price numeric(10,2) NOT NULL CHECK (bak_price > 0),
  duration_days int NOT NULL CHECK (duration_days > 0),
  audience_level int NOT NULL CHECK (audience_level BETWEEN 0 AND 100),
  placements text[] NOT NULL DEFAULT '{}',
  predicted_impressions_low int NOT NULL,
  predicted_impressions_high int NOT NULL,
  predicted_new_fans_low int NOT NULL,
  predicted_new_fans_high int NOT NULL,
  predicted_cost_per_fan numeric(10,4) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','settled','refunded','cancelled')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  actual_impressions int NOT NULL DEFAULT 0,
  actual_new_fans int NOT NULL DEFAULT 0,
  refund_amount numeric(10,2) NOT NULL DEFAULT 0,
  refunded_at timestamptz,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_amplify_campaigns_artist ON public.amplify_campaigns(artist_id, created_at DESC);
CREATE INDEX idx_amplify_campaigns_status ON public.amplify_campaigns(status, ends_at);

GRANT SELECT, INSERT, UPDATE ON public.amplify_campaigns TO authenticated;
GRANT ALL ON public.amplify_campaigns TO service_role;

ALTER TABLE public.amplify_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own campaigns"
  ON public.amplify_campaigns FOR SELECT TO authenticated
  USING (artist_id = auth.uid());

CREATE POLICY "Artists create own campaigns"
  ON public.amplify_campaigns FOR INSERT TO authenticated
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists update own campaigns"
  ON public.amplify_campaigns FOR UPDATE TO authenticated
  USING (artist_id = auth.uid());

CREATE TABLE public.amplify_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.amplify_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression','click','follow','play')),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  placement text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_amplify_events_campaign ON public.amplify_events(campaign_id, event_type);

GRANT SELECT, INSERT ON public.amplify_events TO authenticated;
GRANT ALL ON public.amplify_events TO service_role;

ALTER TABLE public.amplify_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own campaign events"
  ON public.amplify_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.amplify_campaigns c
    WHERE c.id = campaign_id AND c.artist_id = auth.uid()
  ));

-- Settlement: refund proportional BAK if actual reach < 50% of predicted low
CREATE OR REPLACE FUNCTION public.settle_amplify_campaign(p_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_camp amplify_campaigns%ROWTYPE;
  v_threshold numeric;
  v_delivery_ratio numeric;
  v_refund numeric := 0;
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_camp FROM amplify_campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign not found');
  END IF;

  IF v_camp.status IN ('settled','refunded','cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already settled');
  END IF;

  -- Recount actuals from events for integrity
  SELECT COUNT(*) FILTER (WHERE event_type = 'impression'),
         COUNT(*) FILTER (WHERE event_type IN ('follow'))
    INTO v_camp.actual_impressions, v_camp.actual_new_fans
    FROM amplify_events WHERE campaign_id = p_campaign_id;

  v_threshold := v_camp.predicted_impressions_low * 0.5;
  v_delivery_ratio := CASE WHEN v_camp.predicted_impressions_low > 0
    THEN v_camp.actual_impressions::numeric / v_camp.predicted_impressions_low
    ELSE 1 END;

  IF v_camp.actual_impressions < v_threshold THEN
    -- Refund proportional to shortfall vs predicted low
    v_refund := ROUND(v_camp.bak_price * (1 - LEAST(v_delivery_ratio, 1)), 2);

    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_camp.artist_id FOR UPDATE;
    IF FOUND AND v_refund > 0 THEN
      UPDATE wallets SET balance = balance + v_refund WHERE id = v_wallet.id;
      INSERT INTO transactions (wallet_id, type, amount, description, reference_id)
      VALUES (v_wallet.id, 'refund', v_refund,
              'Amplify Boost auto-refund (under-delivered reach)', p_campaign_id);
    END IF;

    UPDATE amplify_campaigns
      SET status = 'refunded',
          actual_impressions = v_camp.actual_impressions,
          actual_new_fans = v_camp.actual_new_fans,
          refund_amount = v_refund,
          refunded_at = now(),
          updated_at = now()
      WHERE id = p_campaign_id;
  ELSE
    UPDATE amplify_campaigns
      SET status = 'settled',
          actual_impressions = v_camp.actual_impressions,
          actual_new_fans = v_camp.actual_new_fans,
          updated_at = now()
      WHERE id = p_campaign_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'refund', v_refund,
    'delivery_ratio', v_delivery_ratio,
    'actual_impressions', v_camp.actual_impressions,
    'actual_new_fans', v_camp.actual_new_fans
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_amplify_campaign(uuid) TO service_role;
