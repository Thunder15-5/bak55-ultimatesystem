import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Coins, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Competition {
  id: string;
  title: string;
  description: string;
  prize_amount: number;
  entry_fee: number;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  voting_start_date: string | null;
  voting_end_date: string | null;
  max_submissions: number | null;
  status: string;
  genres: string[];
}

export default function CompetitionsActive() {
  const { userRole } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Active Competitions</h1>
            <p className="text-muted-foreground">Submit your tracks and compete for prizes</p>
          </div>
          {(userRole === 'brand' || userRole === 'admin') && (
            <Link to="/admin/create-competition">
              <Button>
                <Trophy className="mr-2 h-4 w-4" />
                Create Competition
              </Button>
            </Link>
          )}
        </div>

        {competitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No active competitions at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for new opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => (
              <Card key={competition.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {competition.cover_image && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={competition.cover_image} 
                      alt={competition.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{competition.title}</CardTitle>
                    <Badge variant="secondary">
                      <Trophy className="h-3 w-3 mr-1" />
                      {competition.prize_amount} BAK
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {competition.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {getTimeRemaining(competition.end_date)}
                  </div>
                  
                  {competition.entry_fee > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Coins className="h-4 w-4 mr-2" />
                      Entry Fee: {competition.entry_fee} BAK
                    </div>
                  )}

                  {competition.max_submissions && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Max: {competition.max_submissions} submissions
                    </div>
                  )}

                  {competition.genres && competition.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {competition.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Link to={`/competition/${competition.id}`} className="block">
                    <Button className="w-full mt-2">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
