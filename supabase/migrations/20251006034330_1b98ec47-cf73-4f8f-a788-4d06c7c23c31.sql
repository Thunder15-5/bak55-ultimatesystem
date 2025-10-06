-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('artist', 'brand', 'admin');

-- Create enum for competition status
CREATE TYPE public.competition_status AS ENUM ('draft', 'active', 'voting', 'completed', 'cancelled');

-- Create enum for submission status
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('purchase', 'earning', 'vote', 'prize', 'refund');

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- USER ROLES TABLE (SECURE)
-- ==========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ==========================================
-- ARTIST PROFILES TABLE
-- ==========================================
CREATE TABLE public.artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stage_name TEXT,
  genres TEXT[],
  social_links JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  talent_score INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- Artist profiles policies
CREATE POLICY "Artist profiles are viewable by everyone"
  ON public.artist_profiles FOR SELECT
  USING (true);

CREATE POLICY "Artists can update own profile"
  ON public.artist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- BRAND PROFILES TABLE
-- ==========================================
CREATE TABLE public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Brand profiles policies
CREATE POLICY "Brand profiles are viewable by everyone"
  ON public.brand_profiles FOR SELECT
  USING (true);

CREATE POLICY "Brands can update own profile"
  ON public.brand_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- COMPETITIONS TABLE
-- ==========================================
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  prize_amount DECIMAL(10,2) NOT NULL,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  status public.competition_status DEFAULT 'draft',
  genres TEXT[],
  max_submissions INTEGER,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_start_date TIMESTAMPTZ,
  voting_end_date TIMESTAMPTZ,
  rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Competition policies
CREATE POLICY "Competitions are viewable by everyone"
  ON public.competitions FOR SELECT
  USING (true);

CREATE POLICY "Brands can create competitions"
  ON public.competitions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'brand') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Competition creators can update own competitions"
  ON public.competitions FOR UPDATE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- SUBMISSIONS TABLE
-- ==========================================
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  cover_image TEXT,
  status public.submission_status DEFAULT 'pending',
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competition_id, artist_id)
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Submission policies
CREATE POLICY "Submissions are viewable by everyone"
  ON public.submissions FOR SELECT
  USING (true);

CREATE POLICY "Artists can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = artist_id);

-- ==========================================
-- VOTES TABLE
-- ==========================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Vote policies
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- ==========================================
-- WALLETS TABLE
-- ==========================================
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  currency TEXT DEFAULT 'BAK' NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  type public.transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transaction policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_artist_profiles
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_brand_profiles
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_competitions
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_submissions
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_wallets
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- TRIGGER FOR NEW USER PROFILE CREATION
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Extract role from metadata, default to 'artist'
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'artist');
  
  -- Insert profile
  INSERT INTO public.profiles (id, username, email, bio, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'location'
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  -- Create role-specific profile
  IF _role = 'artist' THEN
    INSERT INTO public.artist_profiles (user_id, stage_name, genres)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'stage_name',
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'genres', '[]'::jsonb)))
    );
  ELSIF _role = 'brand' THEN
    INSERT INTO public.brand_profiles (user_id, company_name, industry, website, description)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'username'),
      NEW.raw_user_meta_data->>'industry',
      NEW.raw_user_meta_data->>'website',
      NEW.raw_user_meta_data->>'bio'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRIGGER FOR VOTE COUNT UPDATE
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_submission_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.submissions
    SET vote_count = vote_count + 1
    WHERE id = NEW.submission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.submissions
    SET vote_count = vote_count - 1
    WHERE id = OLD.submission_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_vote_count
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_submission_vote_count();

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_artist_profiles_user_id ON public.artist_profiles(user_id);
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
CREATE INDEX idx_competitions_created_by ON public.competitions(created_by);
CREATE INDEX idx_competitions_status ON public.competitions(status);
CREATE INDEX idx_submissions_competition_id ON public.submissions(competition_id);
CREATE INDEX idx_submissions_artist_id ON public.submissions(artist_id);
CREATE INDEX idx_votes_submission_id ON public.votes(submission_id);
CREATE INDEX idx_votes_voter_id ON public.votes(voter_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);