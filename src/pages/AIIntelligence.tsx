import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Brain, Sparkles, LineChart, Music, Target, Globe, TrendingUp,
  Loader2, CheckCircle, XCircle, Copy, Download, Clock, Users,
  Zap, BarChart3, Palette, MessageSquare, Share2, Lightbulb
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  genre: string;
  plays: number;
  cover_image: string | null;
}

type AnalysisModule = 'talent_scout' | 'discovery' | 'content_enhance';

interface TrendForecast {
  data: any;
  forecast: any;
}

export default function AIIntelligence() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Record<string, any>>({});
  const [runningModules, setRunningModules] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<any[]>([]);
  const [trendForecast, setTrendForecast] = useState<TrendForecast | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchTracks();
    fetchHistory();
    fetchDailyUsage();

    // Realtime updates for analysis results
    const channel = supabase
      .channel('ai-analyses')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_track_analyses',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new && (payload.new as any).status === 'completed') {
          const analysis = payload.new as any;
          setAnalyses(prev => ({
            ...prev,
            [analysis.analysis_type]: analysis,
          }));
          setRunningModules(prev => {
            const next = new Set(prev);
            next.delete(analysis.analysis_type);
            return next;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchTracks = async () => {
    const { data } = await supabase
      .from('tracks')
      .select('id, title, genre, plays, cover_image')
      .eq('artist_id', user!.id)
      .order('created_at', { ascending: false });
    setTracks(data || []);
    setLoading(false);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('ai_track_analyses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const fetchDailyUsage = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('ai_track_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', since);
    setDailyUsage(count || 0);
  };

  const loadExistingAnalyses = async (trackId: string) => {
    const { data } = await supabase
      .from('ai_track_analyses')
      .select('*')
      .eq('track_id', trackId)
      .eq('user_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    const map: Record<string, any> = {};
    data?.forEach(a => {
      if (!map[a.analysis_type]) map[a.analysis_type] = a;
    });
    setAnalyses(map);
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrack(trackId);
    setAnalyses({});
    loadExistingAnalyses(trackId);
  };

  const runModule = async (module: AnalysisModule) => {
    if (!selectedTrack || !user) return;
    
    setRunningModules(prev => new Set(prev).add(module));
    
    const functionMap: Record<string, string> = {
      talent_scout: 'ai-talent-scout',
      discovery: 'ai-smart-discovery',
      content_enhance: 'ai-content-enhance',
    };

    try {
      const { data, error } = await supabase.functions.invoke(functionMap[module], {
        body: { trackId: selectedTrack }
      });

      if (error) throw error;
      
      if (data?.analysis) {
        setAnalyses(prev => ({
          ...prev,
          [module]: { ...data, raw_analysis: data.analysis, status: 'completed' },
        }));
      }
      
      const isCached = data?.cached;
      toast.success(`${moduleNames[module]} ${isCached ? '(cached)' : 'analysis complete'}!`);
      fetchHistory();
      fetchDailyUsage();
    } catch (err: any) {
      console.error(`${module} error:`, err);
      toast.error(err.message || `${moduleNames[module]} failed`);
    } finally {
      setRunningModules(prev => {
        const next = new Set(prev);
        next.delete(module);
        return next;
      });
    }
  };

  const runAllModules = async () => {
    if (!selectedTrack) {
      toast.error("Select a track first");
      return;
    }
    runModule('talent_scout');
    // Stagger to avoid rate limits
    setTimeout(() => runModule('discovery'), 3000);
    setTimeout(() => runModule('content_enhance'), 6000);
  };

  const runTrendForecast = async () => {
    if (!user) return;
    setLoadingTrends(true);
    try {
      const { data, error } = await supabase.functions.invoke('trend-forecast', {
        body: {}
      });
      if (error) throw error;
      setTrendForecast(data);
      toast.success("Trend forecast generated!");
    } catch (err: any) {
      console.error('Trend forecast error:', err);
      toast.error(err.message || "Failed to generate forecast");
    } finally {
      setLoadingTrends(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const moduleNames: Record<string, string> = {
    talent_scout: 'AI Talent Scout',
    discovery: 'Smart Discovery',
    content_enhance: 'Content Enhancement',
  };

  const selectedTrackData = tracks.find(t => t.id === selectedTrack);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AI Intelligence Suite
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              Real-time AI analysis for your music. Select a track to begin.
            </p>
            <Badge variant="outline" className="whitespace-nowrap">
              {dailyUsage}/10 analyses today
            </Badge>
          </div>
        </div>

        {/* Track Selector */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block">Select Track to Analyze</label>
                <Select value={selectedTrack} onValueChange={handleTrackSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a track..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.map(track => (
                      <SelectItem key={track.id} value={track.id}>
                        <span className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          {track.title} — {track.genre || 'Unknown'} ({track.plays || 0} plays)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={runAllModules}
                disabled={!selectedTrack || runningModules.size > 0}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {runningModules.size > 0 ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" /> Run All AI Modules</>
                )}
              </Button>
            </div>
            {selectedTrackData && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                Selected: <strong className="text-foreground">{selectedTrackData.title}</strong>
                <Badge variant="secondary">{selectedTrackData.genre}</Badge>
                <Badge variant="outline">{selectedTrackData.plays} plays</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedTrack ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold mb-2">Select a Track to Begin</h3>
              <p className="text-muted-foreground">Choose one of your tracks above to run AI analysis modules.</p>
              {tracks.length === 0 && !loading && (
                <Button onClick={() => navigate('/upload')} className="mt-4" variant="hero">
                  Upload Your First Track
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="talent" className="space-y-6">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="talent" className="gap-1">
                <Brain className="h-4 w-4" /> Scout
              </TabsTrigger>
              <TabsTrigger value="discovery" className="gap-1">
                <Globe className="h-4 w-4" /> Discovery
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1">
                <Palette className="h-4 w-4" /> Content
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-1">
                <TrendingUp className="h-4 w-4" /> Trends
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <Clock className="h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>

            {/* TALENT SCOUT TAB */}
            <TabsContent value="talent" className="space-y-4">
              <ModuleHeader
                title="AI Talent Scout"
                description="Comprehensive talent assessment with scores and recommendations"
                icon={Brain}
                isRunning={runningModules.has('talent_scout')}
                hasResults={!!analyses.talent_scout}
                onRun={() => runModule('talent_scout')}
              />
              {analyses.talent_scout?.raw_analysis && (
                <TalentScoutResults data={analyses.talent_scout.raw_analysis} />
              )}
            </TabsContent>

            {/* DISCOVERY TAB */}
            <TabsContent value="discovery" className="space-y-4">
              <ModuleHeader
                title="Smart Discovery Engine"
                description="Audience matching and platform strategy"
                icon={Globe}
                isRunning={runningModules.has('discovery')}
                hasResults={!!analyses.discovery}
                onRun={() => runModule('discovery')}
              />
              {analyses.discovery?.raw_analysis && (
                <DiscoveryResults data={analyses.discovery.raw_analysis} />
              )}
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-4">
              <ModuleHeader
                title="Content Enhancement"
                description="AI-generated promotional content and campaign ideas"
                icon={Palette}
                isRunning={runningModules.has('content_enhance')}
                hasResults={!!analyses.content_enhance}
                onRun={() => runModule('content_enhance')}
              />
              {analyses.content_enhance?.raw_analysis && (
                <ContentResults data={analyses.content_enhance.raw_analysis} onCopy={copyToClipboard} />
              )}
            </TabsContent>

            {/* TRENDS TAB */}
            <TabsContent value="trends" className="space-y-4">
              <Card className="border-primary/10">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Predictive Analytics</h3>
                      <p className="text-sm text-muted-foreground">Platform-wide trend forecasts and release timing</p>
                    </div>
                  </div>
                  <Button onClick={runTrendForecast} disabled={loadingTrends} size="sm" variant={trendForecast ? "outline" : "default"}>
                    {loadingTrends ? (
                      <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Forecasting...</>
                    ) : trendForecast ? (
                      <><Sparkles className="mr-1 h-4 w-4" /> Refresh</>
                    ) : (
                      <><Zap className="mr-1 h-4 w-4" /> Generate Forecast</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {trendForecast && (
                <div className="space-y-4">
                  {/* Overall Forecast */}
                  <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-accent" /> Overall Forecast
                      </h4>
                      <p className="text-sm text-muted-foreground">{trendForecast.forecast?.overallForecast}</p>
                    </CardContent>
                  </Card>

                  {/* Platform Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Music className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{trendForecast.data?.totalTracks || 0}</div>
                        <p className="text-xs text-muted-foreground">New Tracks (90d)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Target className="h-6 w-6 mx-auto mb-2 text-secondary" />
                        <div className="text-2xl font-bold">{trendForecast.data?.activeCompetitions || 0}</div>
                        <p className="text-xs text-muted-foreground">Active Competitions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-6 w-6 mx-auto mb-2 text-accent" />
                        <div className="text-2xl font-bold">{trendForecast.data?.topRegions?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active Regions</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Emerging Genres */}
                  {trendForecast.forecast?.emergingGenres?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-base">🔥 Emerging Genres</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {trendForecast.forecast.emergingGenres.map((g: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div>
                                <p className="font-medium text-sm">{g.genre}</p>
                                <p className="text-xs text-muted-foreground">{g.reasoning}</p>
                              </div>
                              <Badge variant={g.growthPotential === 'high' ? 'default' : 'secondary'}>{g.growthPotential}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Regional Trends */}
                  {trendForecast.forecast?.regionalTrends?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-base">🌍 Regional Trends</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {trendForecast.forecast.regionalTrends.map((r: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <p className="font-medium text-sm">{r.region}</p>
                              <p className="text-xs text-muted-foreground mb-1">{r.trend}</p>
                              <p className="text-xs text-primary">💡 {r.opportunity}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Seasonal Predictions */}
                  {trendForecast.forecast?.seasonalPredictions?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-base">📅 Seasonal Predictions</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {trendForecast.forecast.seasonalPredictions.map((s: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{s.period}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{s.prediction}</p>
                              <p className="text-xs text-primary mt-1">→ {s.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Release Windows */}
                  {trendForecast.forecast?.releaseWindows?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-base">⏰ Optimal Release Windows</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {trendForecast.forecast.releaseWindows.map((w: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div>
                                <p className="font-medium text-sm">{w.window}</p>
                                <p className="text-xs text-muted-foreground">{w.reason}</p>
                              </div>
                              <Badge variant="secondary">{w.genre}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* HISTORY TAB */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>Your past AI analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No analyses yet. Run your first AI module above!</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            {item.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : item.status === 'failed' ? (
                              <XCircle className="h-5 w-5 text-destructive" />
                            ) : (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{moduleNames[item.analysis_type] || item.analysis_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString()} — {item.status}
                              </p>
                            </div>
                          </div>
                          {item.talent_score && (
                            <Badge variant="secondary">Score: {item.talent_score}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

// ---- Sub Components ----

function ModuleHeader({ title, description, icon: Icon, isRunning, hasResults, onRun }: {
  title: string; description: string; icon: any; isRunning: boolean; hasResults: boolean; onRun: () => void;
}) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button onClick={onRun} disabled={isRunning} size="sm" variant={hasResults ? "outline" : "default"}>
          {isRunning ? (
            <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Processing...</>
          ) : hasResults ? (
            <><Sparkles className="mr-1 h-4 w-4" /> Re-analyze</>
          ) : (
            <><Zap className="mr-1 h-4 w-4" /> Analyze</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function ScoreGauge({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  const color = value >= 75 ? 'text-green-500' : value >= 50 ? 'text-yellow-500' : 'text-red-500';
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
        <div className="text-3xl font-bold">{value}</div>
        <Progress value={value} className="mt-2 h-2" />
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function TalentScoutResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreGauge label="Talent Score" value={data.talentScore || 0} icon={Brain} />
        <ScoreGauge label="Commercial Readiness" value={data.commercialReadiness || 0} icon={TrendingUp} />
        <ScoreGauge label="Breakout Probability" value={data.breakoutProbability || 0} icon={Zap} />
        <ScoreGauge label="Success Probability" value={data.successProbability || 0} icon={Target} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ScoreGauge label="Vocal Strength" value={data.vocalStrength || 0} icon={Music} />
        <ScoreGauge label="Production Quality" value={data.productionQuality || 0} icon={BarChart3} />
        <Card>
          <CardContent className="p-4 text-center">
            <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-lg font-bold">{data.emotionalTone || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">Emotional Tone</p>
          </CardContent>
        </Card>
      </div>

      {/* Assessment */}
      {data.overallAssessment && (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" /> Overall Assessment
            </h4>
            <p className="text-sm text-muted-foreground">{data.overallAssessment}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {data.strengths?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base text-green-500">✅ Strengths</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {data.weaknesses?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base text-yellow-500">⚠️ Areas to Improve</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">• {w}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparable Artists */}
      {data.comparableArtists?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🎤 Comparable Artists</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {data.comparableArtists.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  </div>
                  <Badge variant="secondary">{a.similarity}% match</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {data.recommendations?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">💡 Recommendations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommendations.map((r: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={r.priority === 'high' ? 'destructive' : r.priority === 'medium' ? 'default' : 'secondary'}>
                      {r.priority}
                    </Badge>
                    <Badge variant="outline">{r.category}</Badge>
                    <span className="font-medium text-sm">{r.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DiscoveryResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreGauge label="Discovery Score" value={data.discoveryScore || 0} icon={Globe} />
        <ScoreGauge label="Viral Potential" value={data.viralPotential || 0} icon={Zap} />
      </div>

      {data.summary && (
        <Card className="bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
          <CardContent className="p-4">
            <p className="text-sm">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Target Countries */}
      {data.targetCountries?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🌍 Target Countries</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.targetCountries.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{c.country}</p>
                    <p className="text-xs text-muted-foreground">{c.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{c.adoptionLikelihood}%</div>
                    <p className="text-xs text-muted-foreground">Likelihood</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listener Persona */}
      {data.listenerPersona && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">👤 Ideal Listener Persona</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Age Range:</span> <strong>{data.listenerPersona.ageRange}</strong></div>
              <div><span className="text-muted-foreground">Gender:</span> <strong>{data.listenerPersona.gender}</strong></div>
              <div className="col-span-2"><span className="text-muted-foreground">Lifestyle:</span> <strong>{data.listenerPersona.lifestyle}</strong></div>
              <div className="col-span-2"><span className="text-muted-foreground">Habits:</span> <strong>{data.listenerPersona.listeningHabits}</strong></div>
              {data.listenerPersona.otherGenres?.length > 0 && (
                <div className="col-span-2 flex flex-wrap gap-1">
                  <span className="text-muted-foreground mr-1">Also likes:</span>
                  {data.listenerPersona.otherGenres.map((g: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Strategy */}
      {data.platformStrategy?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📱 Platform Strategy</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.platformStrategy.map((p: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{p.platform}</span>
                    <Badge variant={p.expectedImpact === 'high' ? 'default' : 'secondary'}>{p.expectedImpact} impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.strategy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fan Growth Prediction */}
      {data.fanGrowthPrediction && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📈 Fan Growth Prediction</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">+{data.fanGrowthPrediction.thirtyDays}</div>
                <p className="text-xs text-muted-foreground">30 Days</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-secondary">+{data.fanGrowthPrediction.ninetyDays}</div>
                <p className="text-xs text-muted-foreground">90 Days</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-accent">+{data.fanGrowthPrediction.sixMonths}</div>
                <p className="text-xs text-muted-foreground">6 Months</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{data.fanGrowthPrediction.growthStrategy}</p>
          </CardContent>
        </Card>
      )}

      {/* Genre Crossovers */}
      {data.genreCrossovers?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🔀 Genre Crossover Opportunities</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.genreCrossovers.map((g: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{g.genre}</p>
                    <p className="text-xs text-muted-foreground">{g.approach}</p>
                  </div>
                  <Badge variant="secondary">{g.fitScore}% fit</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContentResults({ data, onCopy }: { data: any; onCopy: (text: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Social Captions */}
      {data.promoCaptions && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📝 Social Media Captions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.promoCaptions).map(([platform, captions]: [string, any]) => (
                <div key={platform}>
                  <h5 className="text-sm font-semibold capitalize mb-2 flex items-center gap-1">
                    <Share2 className="h-3 w-3" /> {platform}
                  </h5>
                  <div className="space-y-2">
                    {(Array.isArray(captions) ? captions : []).map((caption: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                        <p className="text-sm flex-1">{caption}</p>
                        <Button size="sm" variant="ghost" onClick={() => onCopy(caption)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Ideas */}
      {data.campaignIdeas?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🚀 Campaign Ideas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.campaignIdeas.map((c: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold">{c.name}</h5>
                    <div className="flex gap-1">
                      <Badge variant="secondary">{c.platform}</Badge>
                      <Badge variant="outline">{c.duration}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                  {c.steps?.length > 0 && (
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      {c.steps.map((s: string, j: number) => <li key={j}>{s}</li>)}
                    </ol>
                  )}
                  <p className="text-xs text-primary mt-2">Expected: {c.expectedOutcome}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Art Concepts */}
      {data.coverArtConcepts?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🎨 Cover Art Concepts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.coverArtConcepts.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{c.style}</Badge>
                    <Badge variant="outline">{c.mood}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {c.colorPalette?.map((color: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 rounded text-xs bg-muted">{color}</span>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" className="mt-2" onClick={() => onCopy(c.description)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy Prompt
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtag Strategy */}
      {data.hashtagStrategy?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">#️⃣ Hashtag Strategy</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.hashtagStrategy.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => onCopy(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => onCopy(data.hashtagStrategy.join(' '))}>
              <Copy className="h-3 w-3 mr-1" /> Copy All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Press Release & Bio */}
      {data.pressRelease && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📰 Press Release</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.pressRelease}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => onCopy(data.pressRelease)}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {data.bioUpdate && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">✍️ Suggested Bio Update</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.bioUpdate}</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => onCopy(data.bioUpdate)}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
