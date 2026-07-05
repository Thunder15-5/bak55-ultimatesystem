import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Coins, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { RetryableError } from "@/components/RetryableError";
import { TrackCardSkeleton } from "@/components/ui/skeleton-components";
import { useNavigate } from "react-router-dom";

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
      
      {/* Hero Section */}
      <div className="relative bg-gradient-radial from-primary/10 via-background to-background border-b border-primary/10">
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 animate-fade-in">
              <Trophy className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Active Now</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-tight animate-fade-in">
              Active <span className="text-gradient-secondary">Competitions</span>
            </h1>
            <p className="text-lg text-muted-foreground animate-fade-in">
              Submit your tracks and compete for prizes
            </p>
          </div>
          
          <div className="flex justify-center">
            {(userRole === 'brand' || userRole === 'admin') && (
              <Link to="/admin/create-competition">
                <Button variant="hero" size="lg">
                  <Trophy className="mr-2 h-5 w-5" />
                  Create Competition
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">

        {competitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No active competitions at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for new opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {competitions.map((competition, index) => {
              // First competition in the sorted list is the most recent/featured
              const isFeatured = index === 0;
              
              return (
              <Card 
                key={competition.id} 
                className={`overflow-hidden hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] touch-manipulation bg-card/50 backdrop-blur-sm group ${
                  isFeatured 
                    ? 'border-2 border-primary/50 shadow-glow ring-2 ring-primary/20' 
                    : 'border-primary/10 hover:border-primary/30'
                }`}
              >
                <div className="h-40 sm:h-48 overflow-hidden relative">
                  {isFeatured && (
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 px-3 py-1 text-xs font-bold shadow-lg">
                        🔥 FEATURED
                      </Badge>
                    </div>
                  )}
                  <img 
                    src={competition.cover_image || "/genesis-competition.png.jpeg"} 
                    alt={competition.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 ${isFeatured ? 'bg-gradient-to-t from-primary/60 to-transparent' : 'bg-gradient-to-t from-black/60 to-transparent'}`} />
                </div>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg sm:text-xl font-heading group-hover:text-primary transition-colors">
                      {competition.title}
                    </CardTitle>
                    <Badge className="text-xs whitespace-nowrap bg-gradient-to-r from-secondary to-secondary-glow border-0">
                      <Trophy className="h-3 w-3 mr-1" />
                      {competition.prize_amount} BAK
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm">
                    {competition.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{getTimeRemaining(competition.end_date)}</span>
                  </div>
                  
                  {competition.entry_fee > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Coins className="h-4 w-4 mr-2 flex-shrink-0" />
                      Entry Fee: {competition.entry_fee} BAK
                    </div>
                  )}

                  {competition.max_submissions && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
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
                    <Button 
                      className={`w-full mt-2 h-10 md:h-11 touch-manipulation ${
                        isFeatured ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90' : ''
                      }`}
                      variant={isFeatured ? 'default' : 'default'}
                    >
                      {isFeatured ? 'Enter Now' : 'View Details'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
