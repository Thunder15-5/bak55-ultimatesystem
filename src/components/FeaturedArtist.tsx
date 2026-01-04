import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Users, Music } from 'lucide-react';

interface FeaturedArtistData {
  id: string;
  artistId: string;
  displayName: string;
  stageName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followers: number;
  tracks: number;
  reason: string | null;
}

export function FeaturedArtist() {
  const navigate = useNavigate();
  const [artist, setArtist] = useState<FeaturedArtistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedArtist();
  }, []);

  const fetchFeaturedArtist = async () => {
    try {
      const now = new Date().toISOString();
      
      // First try to get an explicitly featured artist
      const { data: featured } = await supabase
        .from('featured_artists')
        .select(`
          id,
          artist_id,
          reason,
          profiles!featured_artists_artist_id_fkey (
            id,
            display_name,
            avatar_url,
            bio
          )
        `)
        .lte('featured_from', now)
        .gte('featured_until', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (featured && featured.profiles) {
        const profile = featured.profiles as any;
        
        // Get artist details
        const { data: artistProfile } = await supabase
          .from('artist_profiles')
          .select('stage_name')
          .eq('user_id', featured.artist_id)
          .single();

        // Get counts
        const [{ count: followersCount }, { count: tracksCount }] = await Promise.all([
          supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', featured.artist_id),
          supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', featured.artist_id),
        ]);

        setArtist({
          id: featured.id,
          artistId: featured.artist_id,
          displayName: profile.display_name || 'Unknown Artist',
          stageName: artistProfile?.stage_name || null,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          followers: followersCount || 0,
          tracks: tracksCount || 0,
          reason: featured.reason,
        });
      } else {
        // Fallback: Get a random active artist with tracks
        const { data: randomArtist } = await supabase
          .from('artist_profiles')
          .select(`
            user_id,
            stage_name,
            profiles!artist_profiles_user_id_fkey (
              id,
              display_name,
              avatar_url,
              bio
            )
          `)
          .limit(10);

        if (randomArtist && randomArtist.length > 0) {
          const selected = randomArtist[Math.floor(Math.random() * randomArtist.length)];
          const profile = selected.profiles as any;

          const [{ count: followersCount }, { count: tracksCount }] = await Promise.all([
            supabase
              .from('followers')
              .select('*', { count: 'exact', head: true })
              .eq('artist_id', selected.user_id),
            supabase
              .from('tracks')
              .select('*', { count: 'exact', head: true })
              .eq('artist_id', selected.user_id),
          ]);

          setArtist({
            id: selected.user_id,
            artistId: selected.user_id,
            displayName: profile?.display_name || 'Unknown Artist',
            stageName: selected.stage_name,
            avatarUrl: profile?.avatar_url,
            bio: profile?.bio,
            followers: followersCount || 0,
            tracks: tracksCount || 0,
            reason: 'Rising Talent',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching featured artist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!artist) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative group">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">
            Featured Artist
          </span>
          {artist.reason && (
            <Badge variant="secondary" className="text-xs">
              {artist.reason}
            </Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="w-20 h-20 border-2 border-primary/20 ring-4 ring-primary/10">
            <AvatarImage src={artist.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
              {(artist.stageName || artist.displayName).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold truncate">
              {artist.stageName || artist.displayName}
            </h3>
            {artist.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {artist.bio}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{artist.followers} followers</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Music className="w-4 h-4" />
                <span>{artist.tracks} tracks</span>
              </div>
            </div>
          </div>

          <Button 
            variant="hero" 
            className="flex-shrink-0"
            onClick={() => navigate(`/artist/${artist.artistId}`)}
          >
            <Play className="w-4 h-4 mr-2" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
