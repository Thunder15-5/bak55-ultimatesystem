-- =============================================
-- PRODUCER ROLE: Tables, Policies & Functions
-- =============================================

-- 1. Create producer_profiles table with enterprise features
CREATE TABLE public.producer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    producer_name TEXT NOT NULL,
    bio TEXT,
    genres TEXT[] DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE,
    
    -- Enterprise Features
    producer_tier TEXT DEFAULT 'starter' CHECK (producer_tier IN ('starter', 'pro', 'elite', 'platinum')),
    total_earnings NUMERIC DEFAULT 0,
    total_beats_sold INTEGER DEFAULT 0,
    total_licenses_issued INTEGER DEFAULT 0,
    
    -- Credits & Portfolio
    credits JSONB DEFAULT '[]',
    equipment TEXT[],
    sample_packs_created INTEGER DEFAULT 0,
    
    -- Social & Contact
    social_links JSONB DEFAULT '{}',
    contact_email TEXT,
    website TEXT,
    
    -- Availability & Services
    available_for_hire BOOLEAN DEFAULT TRUE,
    accepts_custom_beats BOOLEAN DEFAULT TRUE,
    turnaround_days INTEGER DEFAULT 7,
    minimum_budget NUMERIC DEFAULT 0,
    
    -- Analytics
    profile_views INTEGER DEFAULT 0,
    average_rating NUMERIC(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create beats table for beat catalog management
CREATE TABLE public.beats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    preview_url TEXT,
    cover_image TEXT,
    
    bpm INTEGER,
    key TEXT,
    genre TEXT,
    mood TEXT[],
    tags TEXT[],
    duration INTEGER,
    
    price_lease_bak NUMERIC DEFAULT 50,
    price_premium_bak NUMERIC DEFAULT 150,
    price_exclusive_bak NUMERIC DEFAULT 500,
    price_lease_kes NUMERIC DEFAULT 1000,
    price_premium_kes NUMERIC DEFAULT 3000,
    price_exclusive_kes NUMERIC DEFAULT 10000,
    
    is_sold_exclusive BOOLEAN DEFAULT FALSE,
    total_leases_sold INTEGER DEFAULT 0,
    max_leases INTEGER,
    
    is_featured BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold_out', 'archived')),
    
    plays INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    
    moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderated_by UUID REFERENCES public.profiles(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create beat licenses table
CREATE TABLE public.beat_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES public.profiles(id),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    
    license_type TEXT NOT NULL CHECK (license_type IN ('lease', 'premium', 'exclusive', 'custom')),
    license_terms JSONB,
    price_paid NUMERIC NOT NULL,
    currency TEXT DEFAULT 'BAK',
    
    producer_share NUMERIC NOT NULL,
    platform_share NUMERIC NOT NULL,
    producer_earnings NUMERIC NOT NULL,
    platform_earnings NUMERIC NOT NULL,
    
    download_url TEXT,
    stems_url TEXT,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Producer collaboration requests
CREATE TABLE public.producer_collaboration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_artist_id UUID NOT NULL REFERENCES public.profiles(id),
    to_producer_id UUID NOT NULL REFERENCES public.profiles(id),
    
    project_type TEXT CHECK (project_type IN ('custom_beat', 'mix_master', 'full_production', 'collab')),
    description TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    deadline DATE,
    reference_tracks TEXT[],
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    producer_response TEXT,
    quoted_price NUMERIC,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Beat likes tracking
CREATE TABLE public.beat_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(beat_id, user_id)
);

-- 6. Producer reviews
CREATE TABLE public.producer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    license_id UUID REFERENCES public.beat_licenses(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    producer_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(producer_id, reviewer_id, license_id)
);

-- Enable RLS
ALTER TABLE public.producer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beat_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beat_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_reviews ENABLE ROW LEVEL SECURITY;

-- Producer Profiles Policies
CREATE POLICY "Producer profiles are viewable by everyone" ON public.producer_profiles
    FOR SELECT USING (true);

CREATE POLICY "Producers can update their own profile" ON public.producer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Producers can insert their own profile" ON public.producer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Beats Policies
CREATE POLICY "Approved beats are viewable by everyone" ON public.beats
    FOR SELECT USING (moderation_status = 'approved' OR producer_id = auth.uid());

CREATE POLICY "Producers can insert their own beats" ON public.beats
    FOR INSERT WITH CHECK (producer_id = auth.uid());

CREATE POLICY "Producers can update their own beats" ON public.beats
    FOR UPDATE USING (producer_id = auth.uid());

CREATE POLICY "Producers can delete their own beats" ON public.beats
    FOR DELETE USING (producer_id = auth.uid());

CREATE POLICY "Admins can manage all beats" ON public.beats
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Beat Licenses Policies
CREATE POLICY "Users can view their own licenses" ON public.beat_licenses
    FOR SELECT USING (buyer_id = auth.uid() OR producer_id = auth.uid());

CREATE POLICY "Buyers can create licenses" ON public.beat_licenses
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Collaboration Requests Policies
CREATE POLICY "Users can view their own collaboration requests" ON public.producer_collaboration_requests
    FOR SELECT USING (from_artist_id = auth.uid() OR to_producer_id = auth.uid());

CREATE POLICY "Artists can create collaboration requests" ON public.producer_collaboration_requests
    FOR INSERT WITH CHECK (from_artist_id = auth.uid());

CREATE POLICY "Participants can update collaboration requests" ON public.producer_collaboration_requests
    FOR UPDATE USING (from_artist_id = auth.uid() OR to_producer_id = auth.uid());

-- Beat Likes Policies
CREATE POLICY "Anyone can view beat likes" ON public.beat_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like beats" ON public.beat_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike beats" ON public.beat_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Producer Reviews Policies
CREATE POLICY "Reviews are viewable by everyone" ON public.producer_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.producer_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their reviews" ON public.producer_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id OR auth.uid() = producer_id);

-- Indexes
CREATE INDEX idx_producer_profiles_user_id ON public.producer_profiles(user_id);
CREATE INDEX idx_producer_profiles_verified ON public.producer_profiles(verified);
CREATE INDEX idx_beats_producer_id ON public.beats(producer_id);
CREATE INDEX idx_beats_genre ON public.beats(genre);
CREATE INDEX idx_beats_status ON public.beats(status);
CREATE INDEX idx_beats_moderation ON public.beats(moderation_status);
CREATE INDEX idx_beat_licenses_buyer ON public.beat_licenses(buyer_id);
CREATE INDEX idx_beat_licenses_producer ON public.beat_licenses(producer_id);
CREATE INDEX idx_beat_likes_beat ON public.beat_likes(beat_id);

-- Triggers for timestamp updates
CREATE TRIGGER update_producer_profiles_updated_at
    BEFORE UPDATE ON public.producer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beats_updated_at
    BEFORE UPDATE ON public.beats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();