-- Add organizer role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organizer';

-- Organizer type enum
DO $$ BEGIN
  CREATE TYPE public.organizer_type AS ENUM (
    'studio','producer','label','brand','event_organizer','university','college','ngo','talent_agency','government','festival','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('unverified','pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  organizer_type public.organizer_type NOT NULL DEFAULT 'other',
  description text,
  logo_url text,
  cover_url text,
  website text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  country text,
  city text,
  contact_email text,
  contact_phone text,
  verification public.verification_status NOT NULL DEFAULT 'unverified',
  verified_at timestamptz,
  verified_by uuid,
  featured boolean NOT NULL DEFAULT false,
  total_competitions integer NOT NULL DEFAULT 0,
  total_prize_awarded numeric NOT NULL DEFAULT 0,
  total_contestants integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  average_rating numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizers TO authenticated;
GRANT SELECT ON public.organizers TO anon;
GRANT ALL ON public.organizers TO service_role;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified organizers"
  ON public.organizers FOR SELECT
  USING (verification = 'verified' OR owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own organizer"
  ON public.organizers FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their organizer"
  ON public.organizers FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete organizers"
  ON public.organizers FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_organizers_owner ON public.organizers(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizers_verification ON public.organizers(verification);

CREATE TRIGGER organizers_updated_at BEFORE UPDATE ON public.organizers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Followers
CREATE TABLE IF NOT EXISTS public.organizer_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.organizer_followers TO authenticated;
GRANT SELECT ON public.organizer_followers TO anon;
GRANT ALL ON public.organizer_followers TO service_role;
ALTER TABLE public.organizer_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organizer followers"
  ON public.organizer_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow organizers"
  ON public.organizer_followers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unfollow organizers"
  ON public.organizer_followers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Reviews (future-ready)
CREATE TABLE IF NOT EXISTS public.organizer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizer_reviews TO authenticated;
GRANT SELECT ON public.organizer_reviews TO anon;
GRANT ALL ON public.organizer_reviews TO service_role;
ALTER TABLE public.organizer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organizer reviews"
  ON public.organizer_reviews FOR SELECT USING (true);
CREATE POLICY "Users can write their own review"
  ON public.organizer_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can edit their own review"
  ON public.organizer_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users or admins can delete reviews"
  ON public.organizer_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER organizer_reviews_updated_at BEFORE UPDATE ON public.organizer_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Competitions gain organizer ownership + marketplace metadata
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES public.organizers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competition_type text NOT NULL DEFAULT 'music',
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS registration_start timestamptz,
  ADD COLUMN IF NOT EXISTS registration_end timestamptz,
  ADD COLUMN IF NOT EXISTS judging_method text NOT NULL DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS vote_price numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_competitions_organizer ON public.competitions(organizer_id);

-- Platform-wide revenue defaults
CREATE TABLE IF NOT EXISTS public.platform_revenue_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_fee_platform_pct numeric NOT NULL DEFAULT 35,
  entry_fee_organizer_pct numeric NOT NULL DEFAULT 65,
  voting_platform_pct numeric NOT NULL DEFAULT 35,
  voting_organizer_pct numeric NOT NULL DEFAULT 0,
  voting_artist_pct numeric NOT NULL DEFAULT 65,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_revenue_defaults TO anon, authenticated;
GRANT ALL ON public.platform_revenue_defaults TO service_role;
ALTER TABLE public.platform_revenue_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read revenue defaults"
  ON public.platform_revenue_defaults FOR SELECT USING (true);
CREATE POLICY "Admins manage revenue defaults"
  ON public.platform_revenue_defaults FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.platform_revenue_defaults (id) VALUES (gen_random_uuid());

CREATE TRIGGER platform_revenue_defaults_updated_at BEFORE UPDATE ON public.platform_revenue_defaults
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-competition revenue configuration
CREATE TABLE IF NOT EXISTS public.competition_revenue_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL UNIQUE REFERENCES public.competitions(id) ON DELETE CASCADE,
  entry_fee_platform_pct numeric NOT NULL DEFAULT 35,
  entry_fee_organizer_pct numeric NOT NULL DEFAULT 65,
  voting_platform_pct numeric NOT NULL DEFAULT 35,
  voting_organizer_pct numeric NOT NULL DEFAULT 0,
  voting_artist_pct numeric NOT NULL DEFAULT 65,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_revenue_config TO authenticated;
GRANT SELECT ON public.competition_revenue_config TO anon;
GRANT ALL ON public.competition_revenue_config TO service_role;
ALTER TABLE public.competition_revenue_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read competition revenue config"
  ON public.competition_revenue_config FOR SELECT USING (true);

CREATE POLICY "Organizers manage their competition revenue config"
  ON public.competition_revenue_config FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.competitions c
      JOIN public.organizers o ON o.id = c.organizer_id
      WHERE c.id = competition_revenue_config.competition_id AND o.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.competitions c
      JOIN public.organizers o ON o.id = c.organizer_id
      WHERE c.id = competition_revenue_config.competition_id AND o.owner_id = auth.uid()
    )
  );

CREATE TRIGGER competition_revenue_config_updated_at BEFORE UPDATE ON public.competition_revenue_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
