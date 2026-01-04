import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { TrendingUp, Play, Flame } from 'lucide-react';

interface TrendingTrack {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  coverImage: string | null;
  plays: number;
  audioUrl: string;
  genre: string | null;
}

export function TrendingTracks({ limit = 5 }: { limit?: number }) {
  const navigate = useNavigate();
  const { playTrack } = useMusicPlayer();
  const [tracks, setTracks] = useState<TrendingTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTracks();
  }, [limit]);

  const fetchTrendingTracks = async () => {
    try {
      // Get tracks ordered by plays (trending = most plays)
      const { data } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          cover_image,
          plays,
          audio_url,
          genre,
          artist_id,
          profiles!tracks_artist_id_fkey (
            display_name
          ),
          artist_profiles!tracks_artist_id_fkey (
            stage_name
          )
        `)
        .eq('moderation_status', 'approved')
        .order('plays', { ascending: false })
        .limit(limit);

      if (data) {
        const formattedTracks = data.map(track => {
          const profile = track.profiles as any;
          const artistProfile = track.artist_profiles as any;
          return {
            id: track.id,
            title: track.title,
            artistName: artistProfile?.stage_name || profile?.display_name || 'Unknown Artist',
            artistId: track.artist_id,
            coverImage: track.cover_image,
            plays: track.plays || 0,
            audioUrl: track.audio_url,
            genre: track.genre,
          };
        });
        setTracks(formattedTracks);
      }
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: TrendingTrack) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Trending Now
            </CardTitle>
            <CardDescription>Most played tracks this week</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/catalog')}
            className="text-xs"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
            onClick={() => handlePlay(track)}
          >
            {/* Rank */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
              index === 1 ? 'bg-gray-400/20 text-gray-400' :
              index === 2 ? 'bg-orange-600/20 text-orange-600' :
              'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>

            {/* Cover */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {track.coverImage ? (
                <img
                  src={track.coverImage}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {track.artistName}
              </p>
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium">{track.plays.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">plays</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
