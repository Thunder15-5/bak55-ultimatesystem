-- Create followers table for artist follower system
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, artist_id)
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Followers policies
CREATE POLICY "Anyone can view followers" 
ON public.followers FOR SELECT 
USING (true);

CREATE POLICY "Users can follow artists" 
ON public.followers FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow artists" 
ON public.followers FOR DELETE 
USING (auth.uid() = follower_id);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Playlists policies
CREATE POLICY "Public playlists are viewable by everyone" 
ON public.playlists FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own playlists" 
ON public.playlists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" 
ON public.playlists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" 
ON public.playlists FOR DELETE 
USING (auth.uid() = user_id);

-- Create playlist_tracks junction table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Enable RLS
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Playlist tracks policies
CREATE POLICY "Anyone can view public playlist tracks" 
ON public.playlist_tracks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE playlists.id = playlist_tracks.playlist_id 
    AND (playlists.is_public = true OR playlists.user_id = auth.uid())
  )
);

CREATE POLICY "Users can add tracks to own playlists" 
ON public.playlist_tracks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE playlists.id = playlist_tracks.playlist_id 
    AND playlists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove tracks from own playlists" 
ON public.playlist_tracks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE playlists.id = playlist_tracks.playlist_id 
    AND playlists.user_id = auth.uid()
  )
);

-- Create listening_history table
CREATE TABLE public.listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  listened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_listening_history_user_id ON public.listening_history(user_id);
CREATE INDEX idx_listening_history_track_id ON public.listening_history(track_id);
CREATE INDEX idx_listening_history_listened_at ON public.listening_history(listened_at DESC);

-- Enable RLS
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- Listening history policies
CREATE POLICY "Users can view own listening history" 
ON public.listening_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own listening history" 
ON public.listening_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at on comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on playlists
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();