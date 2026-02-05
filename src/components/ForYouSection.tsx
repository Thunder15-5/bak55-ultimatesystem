import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Sparkles, Play, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecommendedTrack {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  coverImage: string | null;
  audioUrl: string;
  genre: string | null;
  reason: string;
}

export function ForYouSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playTrack, addToQueue } = useMusicPlayer();
  const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      // Get user's listening history and followed artists
      const [historyResult, followsResult] = await Promise.all([
        supabase
          .from('listening_history')
          .select('track_id, tracks!inner(genre, artist_id)')
          .eq('user_id', user?.id)
          .order('listened_at', { ascending: false })
          .limit(20),
        supabase
          .from('followers')
          .select('artist_id')
          .eq('follower_id', user?.id),
      ]);

      // Get genres from listening history
      const genres = new Set<string>();
      const listenedTrackIds = new Set<string>();
      const favoriteArtists = new Set<string>();

      historyResult.data?.forEach(h => {
        const track = h.tracks as any;
        if (track?.genre) genres.add(track.genre);
        listenedTrackIds.add(h.track_id);
        if (track?.artist_id) favoriteArtists.add(track.artist_id);
      });

      followsResult.data?.forEach(f => {
        favoriteArtists.add(f.artist_id);
      });

      // Fetch recommendations based on preferences
      let recommendations: RecommendedTrack[] = [];

      // 1. Tracks from followed artists
      if (favoriteArtists.size > 0) {
        const { data: artistTracks } = await supabase
          .from('tracks')
          .select('id, title, cover_image, audio_url, genre, artist_id')
          .in('artist_id', Array.from(favoriteArtists))
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(5);

        if (artistTracks && artistTracks.length > 0) {
          // Fetch artist names separately
          const artistIds = [...new Set(artistTracks.map(t => t.artist_id))];
          const [artistProfilesRes, profilesRes] = await Promise.all([
            supabase.from('artist_profiles').select('user_id, stage_name').in('user_id', artistIds),
            supabase.from('profiles').select('id, display_name').in('id', artistIds),
          ]);

          artistTracks.forEach(track => {
            if (!listenedTrackIds.has(track.id)) {
              const artistProfile = artistProfilesRes.data?.find(ap => ap.user_id === track.artist_id);
              const profile = profilesRes.data?.find(p => p.id === track.artist_id);
              recommendations.push({
                id: track.id,
                title: track.title,
                artistName: artistProfile?.stage_name || profile?.display_name || 'Unknown',
                artistId: track.artist_id,
                coverImage: track.cover_image,
                audioUrl: track.audio_url,
                genre: track.genre,
                reason: 'From artists you follow',
              });
            }
          });
        }
      }

      // 2. Similar genres
      if (genres.size > 0 && recommendations.length < 10) {
        const { data: genreTracks } = await supabase
          .from('tracks')
          .select('id, title, cover_image, audio_url, genre, artist_id')
          .in('genre', Array.from(genres))
          .eq('moderation_status', 'approved')
          .order('plays', { ascending: false })
          .limit(10);

        if (genreTracks && genreTracks.length > 0) {
          const artistIds = [...new Set(genreTracks.map(t => t.artist_id))];
          const [artistProfilesRes, profilesRes] = await Promise.all([
            supabase.from('artist_profiles').select('user_id, stage_name').in('user_id', artistIds),
            supabase.from('profiles').select('id, display_name').in('id', artistIds),
          ]);

          genreTracks.forEach(track => {
            if (!listenedTrackIds.has(track.id) && !recommendations.find(r => r.id === track.id)) {
              const artistProfile = artistProfilesRes.data?.find(ap => ap.user_id === track.artist_id);
              const profile = profilesRes.data?.find(p => p.id === track.artist_id);
              recommendations.push({
                id: track.id,
                title: track.title,
                artistName: artistProfile?.stage_name || profile?.display_name || 'Unknown',
                artistId: track.artist_id,
                coverImage: track.cover_image,
                audioUrl: track.audio_url,
                genre: track.genre,
                reason: `Because you like ${track.genre}`,
              });
            }
          });
        }
      }

      // 3. Popular tracks fallback
      if (recommendations.length < 5) {
        const { data: popularTracks } = await supabase
          .from('tracks')
          .select('id, title, cover_image, audio_url, genre, artist_id')
          .eq('moderation_status', 'approved')
          .order('plays', { ascending: false })
          .limit(10);

        if (popularTracks && popularTracks.length > 0) {
          const artistIds = [...new Set(popularTracks.map(t => t.artist_id))];
          const [artistProfilesRes, profilesRes] = await Promise.all([
            supabase.from('artist_profiles').select('user_id, stage_name').in('user_id', artistIds),
            supabase.from('profiles').select('id, display_name').in('id', artistIds),
          ]);

          popularTracks.forEach(track => {
            if (!recommendations.find(r => r.id === track.id)) {
              const artistProfile = artistProfilesRes.data?.find(ap => ap.user_id === track.artist_id);
              const profile = profilesRes.data?.find(p => p.id === track.artist_id);
              recommendations.push({
                id: track.id,
                title: track.title,
                artistName: artistProfile?.stage_name || profile?.display_name || 'Unknown',
                artistId: track.artist_id,
                coverImage: track.cover_image,
                audioUrl: track.audio_url,
                genre: track.genre,
                reason: 'Popular on BAK55',
              });
            }
          });
        }
      }

      setTracks(recommendations.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: RecommendedTrack) => {
    playTrack({
      id: track.id,
      title: track.title,
      artist_id: track.artistId,
      audio_url: track.audioUrl,
      cover_image: track.coverImage,
      genre: track.genre,
      profiles: {
        username: track.artistName,
      },
    });
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      handlePlay(tracks[0]);
      tracks.slice(1).forEach(track => {
        addToQueue({
          id: track.id,
          title: track.title,
          artist_id: track.artistId,
          audio_url: track.audioUrl,
          cover_image: track.coverImage,
          genre: track.genre,
          profiles: {
            username: track.artistName,
          },
        });
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            For You
          </CardTitle>
          <CardDescription>Personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Start listening and following artists to get personalized recommendations!
          </p>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => navigate('/fan/discover')}
          >
            Discover Music
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              For You
            </CardTitle>
            <CardDescription>Personalized picks based on your taste</CardDescription>
          </div>
          <Button variant="hero" size="sm" onClick={handlePlayAll}>
            <Play className="w-4 h-4 mr-1" />
            Play All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="group cursor-pointer"
              onClick={() => handlePlay(track)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                {track.coverImage ? (
                  <img
                    src={track.coverImage}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
              </div>
              <p className="font-medium text-sm truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {track.reason}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
