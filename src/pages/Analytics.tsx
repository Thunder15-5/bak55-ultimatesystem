import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, Music, DollarSign, 
  Clock, MapPin, Lightbulb, Calendar, Loader2, Sparkles
} from "lucide-react";

interface AnalyticsData {
  tracks: number;
  totalPlays: number;
  genres: string[];
  followers: number;
  totalEarnings: number;
  avgPlaysPerTrack: string;
  topLocations: Record<string, number>;
  recentPerformance: Array<{ title: string; plays: number; daysOld: number }>;
  competitionStats: {
    totalSubmissions: number;
    avgVotes: string;
    avgAiScore: string;
  };
}

interface Insights {
  overallPerformance: string;
  strengths: string[];
  growthOpportunities: string[];
  demographicInsights: string;
  genreRecommendations: string;
  nextSteps: string[];
}

export default function Analytics() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingTiming, setLoadingTiming] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [timing, setTiming] = useState<any>(null);
  
  const [playsOverTime, setPlaysOverTime] = useState<any[]>([]);
  const [earningsOverTime, setEarningsOverTime] = useState<any[]>([]);

  useEffect(() => {
    if (user && userRole === 'artist') {
      fetchAnalyticsData();

      // Real-time updates for plays and earnings
      const channel = supabase
        .channel('analytics-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'listening_history',
        }, () => {
          fetchAnalyticsData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions',
        }, () => {
          fetchAnalyticsData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userRole]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch tracks with play history
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, title, plays, created_at, genre')
        .eq('artist_id', user?.id)
        .order('created_at', { ascending: true });

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', user?.id);

      // Fetch artist profile for earnings
      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('total_earnings')
        .eq('user_id', user?.id)
        .single();

      // Fetch competition stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select('ai_score, vote_count')
        .eq('artist_id', user?.id);

      // Create plays over time data
      const playsData = tracks?.map((track, idx) => ({
        name: new Date(track.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        plays: track.plays || 0,
        cumulativePlays: tracks.slice(0, idx + 1).reduce((sum, t) => sum + (t.plays || 0), 0),
      })) || [];
      setPlaysOverTime(playsData);

      // Calculate analytics data
      const totalPlays = tracks?.reduce((sum, t) => sum + (t.plays || 0), 0) || 0;
      const genres = [...new Set(tracks?.map(t => t.genre).filter(Boolean))] as string[];
      const avgPlays = tracks?.length ? (totalPlays / tracks.length).toFixed(1) : '0';
      
      // Competition stats
      const totalSubmissions = submissions?.length || 0;
      const avgVotes = totalSubmissions > 0 
        ? (submissions.reduce((sum, s) => sum + (s.vote_count || 0), 0) / totalSubmissions).toFixed(1)
        : '0';
      const avgAiScore = totalSubmissions > 0
        ? (submissions.filter(s => s.ai_score).reduce((sum, s) => sum + (s.ai_score || 0), 0) / submissions.filter(s => s.ai_score).length).toFixed(1)
        : '0';

      // Recent performance
      const recentPerformance = tracks?.slice(-5).map(t => ({
        title: t.title,
        plays: t.plays || 0,
        daysOld: Math.floor((Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      })) || [];

      // Set analytics data - THIS WAS MISSING!
      setAnalyticsData({
        tracks: tracks?.length || 0,
        totalPlays,
        genres,
        followers: followersCount || 0,
        totalEarnings: artistProfile?.total_earnings || 0,
        avgPlaysPerTrack: avgPlays,
        topLocations: { 'Kenya': 80, 'Nigeria': 15, 'Other': 5 },
        recentPerformance,
        competitionStats: {
          totalSubmissions,
          avgVotes,
          avgAiScore,
        },
      });

      // Fetch transactions for earnings over time
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (wallet) {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, created_at, type')
          .eq('wallet_id', wallet.id)
          .eq('type', 'earning')
          .order('created_at', { ascending: true });

        const earningsData = transactions?.reduce((acc: any[], txn, idx) => {
          const date = new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const amount = Number(txn.amount);
          const cumulative = idx === 0 ? amount : acc[acc.length - 1].cumulative + amount;
          acc.push({ date, amount, cumulative });
          return acc;
        }, []) || [];
        setEarningsOverTime(earningsData);
      }

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    if (!analyticsData) {
      toast.error("Please load analytics data first");
      return;
    }

    try {
      setLoadingInsights(true);
      
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('analytics-insights', {
        body: { 
          artistId: user?.id,
          analyticsData
        },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (error.message?.includes('Payment required')) {
          toast.error("Credits required. Please add credits to continue.");
        } else {
          throw error;
        }
        return;
      }
      
      setInsights(data);
      toast.success("AI insights generated!");
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
      toast.error("Failed to generate insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchTrendForecast = async () => {
    try {
      setLoadingTrends(true);
      const { data, error } = await supabase.functions.invoke('trend-forecast');

      if (error) throw error;
      
      setTrends(data);
      toast.success("Trend forecast generated!");
    } catch (error: any) {
      console.error('Error fetching trends:', error);
      toast.error("Failed to generate trend forecast");
    } finally {
      setLoadingTrends(false);
    }
  };

  const fetchReleaseTiming = async () => {
    try {
      setLoadingTiming(true);
      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('genres')
        .eq('user_id', user?.id)
        .single();

      const { data, error } = await supabase.functions.invoke('release-timing', {
        body: { 
          artistId: user?.id,
          genre: artistProfile?.genres?.[0] || 'Afrobeats'
        }
      });

      if (error) throw error;
      
      setTiming(data);
      toast.success("Release timing recommendations generated!");
    } catch (error: any) {
      console.error('Error fetching release timing:', error);
      toast.error("Failed to generate timing recommendations");
    } finally {
      setLoadingTiming(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--primary-glow))', 'hsl(var(--secondary-glow))'];

  useEffect(() => {
    if (userRole && userRole !== 'artist' && userRole !== 'admin') {
      navigate('/dashboard');
      toast.error('Analytics are only available for artists.');
    }
  }, [userRole, navigate]);

  if (userRole !== 'artist' && userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Analytics & Intelligence
            </h1>
            <p className="text-muted-foreground">
              AI-powered insights to grow your music career
            </p>
          </div>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="timing">Release Timing</TabsTrigger>
          </TabsList>

          {/* Performance Charts */}
          <TabsContent value="performance" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="p-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : (
              <>
                {analyticsData && (
                  <AnalyticsOverview stats={{
                    totalPlays: analyticsData.totalPlays,
                    totalEarnings: analyticsData.totalEarnings,
                    followers: analyticsData.followers,
                    tracks: analyticsData.tracks,
                    avgPlaysPerTrack: analyticsData.avgPlaysPerTrack
                  }} />
                )}
                
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Plays Over Time</CardTitle>
                      <CardDescription>Track performance growth</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={playsOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="plays" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            name="Track Plays"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cumulativePlays" 
                            stroke="hsl(var(--secondary))" 
                            strokeWidth={2}
                            name="Total Plays"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Earnings Over Time</CardTitle>
                      <CardDescription>BAKCoins revenue growth</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={earningsOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" name="Earnings" />
                          <Line 
                            type="monotone" 
                            dataKey="cumulative" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={2}
                            name="Total Earnings"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights" className="space-y-6">
            {!insights ? (
              <Card>
                <CardContent className="p-12 text-center space-y-4">
                  <Sparkles className="h-16 w-16 mx-auto text-primary" />
                  <h3 className="text-2xl font-bold">Generate AI-Powered Insights</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get personalized recommendations, demographic insights, and growth strategies powered by advanced AI analysis.
                  </p>
                  <Button 
                    onClick={fetchAIInsights} 
                    disabled={loadingInsights}
                    size="lg"
                    variant="hero"
                  >
                    {loadingInsights ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {analyticsData && (
                  <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Music className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-3xl font-bold">{analyticsData.tracks}</div>
                        <div className="text-sm text-muted-foreground">Total Tracks</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-secondary" />
                        <div className="text-3xl font-bold">{analyticsData.totalPlays.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Plays</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
                        <div className="text-3xl font-bold">{analyticsData.followers}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary-glow" />
                        <div className="text-3xl font-bold">{analyticsData.totalEarnings.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">BAKCoins Earned</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Overall Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg">{insights.overallPerformance}</p>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Strengths</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {insights.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p>{strength}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Growth Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {insights.growthOpportunities.map((opportunity, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <p>{opportunity}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-secondary" />
                      Demographic Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{insights.demographicInsights}</p>
                    {analyticsData?.topLocations && Object.keys(analyticsData.topLocations).length > 0 && (
                      <div className="grid gap-2 md:grid-cols-3">
                        {Object.entries(analyticsData.topLocations)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([location, count]) => (
                            <Badge key={location} variant="secondary" className="justify-between">
                              <span>{location}</span>
                              <span className="ml-2 text-xs">{count} listens</span>
                            </Badge>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Genre Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{insights.genreRecommendations}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.nextSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button 
                    onClick={fetchAIInsights} 
                    disabled={loadingInsights}
                    variant="outline"
                  >
                    {loadingInsights ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Regenerate Insights
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-6">
            {!trends ? (
              <Card>
                <CardContent className="p-12 text-center space-y-4">
                  <TrendingUp className="h-16 w-16 mx-auto text-secondary" />
                  <h3 className="text-2xl font-bold">Platform Trend Forecast</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get AI-powered predictions about emerging genres, regional trends, and seasonal patterns.
                  </p>
                  <Button 
                    onClick={fetchTrendForecast} 
                    disabled={loadingTrends}
                    size="lg"
                    variant="hero"
                  >
                    {loadingTrends ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Generate Forecast
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Forecast</CardTitle>
                    <CardDescription>Next 3-6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg">{trends.forecast.overallForecast}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Genres</CardTitle>
                    <CardDescription>Genres showing growth potential</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trends.forecast.emergingGenres.map((genre: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">{genre.genre}</h4>
                            <Badge variant={genre.growthPotential === 'high' ? 'default' : 'secondary'}>
                              {genre.growthPotential} potential
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{genre.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regional Trends</CardTitle>
                    <CardDescription>Geographic opportunities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trends.forecast.regionalTrends.map((region: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-secondary" />
                            <h4 className="font-bold">{region.region}</h4>
                          </div>
                          <p className="text-sm mb-2">{region.trend}</p>
                          <p className="text-sm text-primary">💡 {region.opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Predictions</CardTitle>
                    <CardDescription>Time-based opportunities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trends.forecast.seasonalPredictions.map((season: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-accent" />
                            <h4 className="font-bold">{season.period}</h4>
                          </div>
                          <p className="text-sm mb-2">{season.prediction}</p>
                          <p className="text-sm text-primary">→ {season.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button 
                    onClick={fetchTrendForecast} 
                    disabled={loadingTrends}
                    variant="outline"
                  >
                    {loadingTrends ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Regenerate Forecast
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Release Timing */}
          <TabsContent value="timing" className="space-y-6">
            {!timing ? (
              <Card>
                <CardContent className="p-12 text-center space-y-4">
                  <Clock className="h-16 w-16 mx-auto text-accent" />
                  <h3 className="text-2xl font-bold">Optimal Release Timing</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get AI-powered recommendations on the best day and time to release your next track for maximum impact.
                  </p>
                  <Button 
                    onClick={fetchReleaseTiming} 
                    disabled={loadingTiming}
                    size="lg"
                    variant="hero"
                  >
                    {loadingTiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Get Recommendations
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Optimal Release Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-6 bg-primary/10 rounded-lg">
                        <div className="text-4xl font-bold mb-2">{timing.recommendations.optimalReleaseDay}</div>
                        <div className="text-2xl text-primary mb-2">{timing.recommendations.optimalReleaseTime}</div>
                        <p className="text-sm text-muted-foreground">(East African Time)</p>
                      </div>
                      <p className="text-sm">{timing.recommendations.reasoning}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alternative Time Slots</CardTitle>
                      <CardDescription>Backup options that also work well</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {timing.recommendations.alternativeSlots.map((slot: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg border">
                            <div className="font-bold mb-1">{slot.day} at {slot.time}</div>
                            <p className="text-xs text-muted-foreground">{slot.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Timing Tips</CardTitle>
                    <CardDescription>Maximize your release impact</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timing.recommendations.strategicTiming.map((tip: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">{tip.suggestion}</p>
                            <p className="text-sm text-muted-foreground">Impact: {tip.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Competition Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{timing.recommendations.competitionStrategy}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{timing.recommendations.seasonalAdvice}</p>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button 
                    onClick={fetchReleaseTiming} 
                    disabled={loadingTiming}
                    variant="outline"
                  >
                    {loadingTiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Regenerate Recommendations
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}