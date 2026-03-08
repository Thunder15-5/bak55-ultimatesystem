
-- Push notification tokens table
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push tokens" ON public.push_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  follows BOOLEAN DEFAULT true,
  tips BOOLEAN DEFAULT true,
  competitions BOOLEAN DEFAULT true,
  messages BOOLEAN DEFAULT true,
  track_updates BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Brand campaigns table
CREATE TABLE public.brand_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  competition_id UUID REFERENCES public.competitions(id),
  target_genres TEXT[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands manage own campaigns" ON public.brand_campaigns
  FOR ALL TO authenticated
  USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Public can view active campaigns" ON public.brand_campaigns
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Live stream chat messages
CREATE TABLE public.stream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_tip BOOLEAN DEFAULT false,
  tip_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stream_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stream chat" ON public.stream_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send chat messages" ON public.stream_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for stream chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_chat_messages;

-- Add stream_key to live_streams if not exists
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS stream_key TEXT;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS total_tips NUMERIC DEFAULT 0;

-- Indexes
CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);
CREATE INDEX idx_stream_chat_stream ON public.stream_chat_messages(stream_id, created_at);
CREATE INDEX idx_brand_campaigns_brand ON public.brand_campaigns(brand_id);
CREATE INDEX idx_listening_history_user_date ON public.listening_history(user_id, listened_at DESC);
