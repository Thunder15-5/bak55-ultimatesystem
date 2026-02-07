import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  Music2,
  TrendingUp
} from "lucide-react";

interface Competition {
  id: string;
  title: string;
  description: string;
  prize_amount: number;
  entry_fee: number;
  start_date: string;
  end_date: string;
  status: string;
  cover_image: string | null;
  genres: string[];
  submissions: { count: number }[];
}

export default function ProducerCompetitions() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompetitions();
    }
  }, [user]);

  const fetchCompetitions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all active competitions
      const { data: allComps, error: allError } = await supabase
        .from('competitions')
        .select('*, submissions(count)')
        .in('status', ['active', 'voting', 'draft'])
        .order('start_date', { ascending: true });

      if (allError) throw allError;
      setCompetitions(allComps as any || []);

      // Fetch competitions created by this producer
      const { data: myComps, error: myError } = await supabase
        .from('competitions')
        .select('*, submissions(count)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (!myError) {
        setMyCompetitions(myComps as any || []);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Upcoming</Badge>;
      case 'voting':
        return <Badge className="bg-purple-500">Voting</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              <span className="text-gradient">Competitions</span>
            </h1>
            <p className="text-muted-foreground">
              Host beat competitions and discover new talent
            </p>
          </div>
          <Link to="/producer/competitions/create">
            <Button variant="hero" className="gap-2">
              <Plus className="w-4 h-4" /> Host Competition
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Competitions */}
            {myCompetitions.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  My Competitions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCompetitions.map((comp) => (
                    <Card key={comp.id} className="border-primary/30 overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        {comp.cover_image ? (
                          <img src={comp.cover_image} alt={comp.title} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-12 h-12 text-primary" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold line-clamp-1">{comp.title}</h3>
                          {getStatusBadge(comp.status)}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> {comp.prize_amount} BAK
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {comp.submissions?.[0]?.count || 0}
                          </span>
                        </div>
                        <Link to={`/competition/${comp.id}`}>
                          <Button variant="outline" className="w-full" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* All Active Competitions */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                Active Competitions
              </h2>
              {competitions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active competitions</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to host a beat competition!
                    </p>
                    <Link to="/producer/competitions/create">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" /> Create Competition
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {competitions.map((comp) => (
                    <Card key={comp.id} className="overflow-hidden hover:border-primary/40 transition-colors">
                      <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        {comp.cover_image ? (
                          <img src={comp.cover_image} alt={comp.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music2 className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold line-clamp-1">{comp.title}</h3>
                          {getStatusBadge(comp.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {comp.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> {comp.prize_amount} BAK
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {comp.submissions?.[0]?.count || 0} entries
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> 
                            {format(new Date(comp.end_date), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {comp.genres?.slice(0, 2).map((genre) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                        <Link to={`/competition/${comp.id}`} className="block mt-3">
                          <Button variant="outline" className="w-full" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
