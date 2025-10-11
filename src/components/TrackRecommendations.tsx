import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Music, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  genre: string;
  cover_image: string | null;
  plays: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export function TrackRecommendations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-tracks', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      toast.success('Recommendations updated!');
    } catch (error: any) {
      console.error('Failed to load recommendations:', error);
      toast.error(error.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Recommended for You
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Listen to more tracks to get personalized recommendations
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/track/${track.id}`)}
              >
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {track.cover_image ? (
                    <img
                      src={track.cover_image}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.profiles.username} • {track.genre}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
