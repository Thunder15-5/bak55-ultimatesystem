import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, Heart, Award } from "lucide-react";

interface ArtistJourney {
  id: string;
  artist_id: string;
  total_votes_received: number;
  highest_rank: number | null;
  stages_participated: number;
  is_eliminated: boolean;
  final_placement: number | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface ArtistProgressCardProps {
  competitionId: string;
  limit?: number;
}

export function ArtistProgressCard({ competitionId, limit }: ArtistProgressCardProps) {
  const [artists, setArtists] = useState<ArtistJourney[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistJourneys();
  }, [competitionId]);

  const fetchArtistJourneys = async () => {
    try {
      let query = supabase
        .from('artist_competition_journey')
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .eq('competition_id', competitionId)
        .eq('is_eliminated', false)
        .order('total_votes_received', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Get stage names separately
      const journeysWithStage = await Promise.all((data || []).map(async (journey) => {
        const { data: artistProfile } = await supabase
          .from('artist_profiles')
          .select('stage_name')
          .eq('user_id', journey.artist_id)
          .single();
        
        return {
          ...journey,
          stage_name: artistProfile?.stage_name,
        };
      }));
      
      setArtists(journeysWithStage as any);
    } catch (error) {
      console.error('Error fetching artist journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (artists.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No artists in this competition yet
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Artist Leaderboard</h3>
        <Badge variant="outline">
          <Trophy className="h-3 w-3 mr-1" />
          {artists.length} Active
        </Badge>
      </div>

      <div className="grid gap-3">
        {artists.map((artist, index) => (
          <Card key={artist.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={artist.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {artist.profiles?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {index < 3 && (
                    <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      'bg-orange-600'
                    } text-white`}>
                      {index + 1}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {(artist as any).stage_name || artist.profiles?.username}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      @{artist.profiles?.username}
                    </p>
                  </div>
                  {artist.is_eliminated && (
                    <Badge variant="outline" className="text-xs">
                      Eliminated
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">{artist.total_votes_received}</span>
                    <span className="text-muted-foreground text-xs">votes</span>
                  </div>
                  
                  {artist.highest_rank && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">#{artist.highest_rank}</span>
                      <span className="text-muted-foreground text-xs">peak</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{artist.stages_participated}</span>
                    <span className="text-muted-foreground text-xs">stages</span>
                  </div>
                </div>

                {/* Vote momentum indicator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{artist.total_votes_received} votes</span>
                  </div>
                  <Progress 
                    value={Math.min((artist.total_votes_received / 100) * 100, 100)} 
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}