import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Users, Trophy, AlertCircle } from "lucide-react";

interface JourneyData {
  competition_id: string;
  total_votes_received: number;
  highest_rank: number;
  stages_participated: number;
  is_eliminated: boolean;
  final_placement: number;
  competitions: {
    title: string;
    cover_image: string;
  };
}

interface ArtistJourneyTimelineProps {
  artistId: string;
}

export function ArtistJourneyTimeline({ artistId }: ArtistJourneyTimelineProps) {
  const [journeys, setJourneys] = useState<JourneyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourneys();
  }, [artistId]);

  const fetchJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_competition_journey')
        .select(`
          *,
          competitions (
            title,
            cover_image
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJourneys(data || []);
    } catch (error) {
      console.error('Error fetching journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  if (journeys.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No competition history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Competition Journey</h3>
        <Badge variant="outline">
          {journeys.length} {journeys.length === 1 ? 'Competition' : 'Competitions'}
        </Badge>
      </div>

      <div className="space-y-4">
        {journeys.map((journey) => (
          <Card key={journey.competition_id} className="border-primary/20 overflow-hidden">
            <div className="flex">
              {journey.competitions?.cover_image && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={journey.competitions.cover_image}
                    alt={journey.competitions.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{journey.competitions?.title}</CardTitle>
                      {journey.is_eliminated ? (
                        <Badge variant="secondary" className="mt-1">
                          Eliminated
                        </Badge>
                      ) : journey.final_placement ? (
                        <Badge variant="default" className="mt-1">
                          #{journey.final_placement} Place
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-1">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    {journey.final_placement <= 3 && (
                      <Trophy className={`h-8 w-8 ${
                        journey.final_placement === 1 ? 'text-yellow-500' :
                        journey.final_placement === 2 ? 'text-gray-400' :
                        'text-orange-600'
                      }`} />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-3 w-3" />
                        <span>Votes</span>
                      </div>
                      <div className="font-semibold">{journey.total_votes_received}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Best Rank</span>
                      </div>
                      <div className="font-semibold">
                        {journey.highest_rank ? `#${journey.highest_rank}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Award className="h-3 w-3" />
                        <span>Stages</span>
                      </div>
                      <div className="font-semibold">{journey.stages_participated}</div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
