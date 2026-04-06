import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCompetitionShareUrl } from "@/lib/shareUrl";
import { CompetitionSEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Calendar, Music, Heart, ArrowLeft, Sparkles, Share2, Clock, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { JudgeCompetition } from "@/components/JudgeCompetition";
import { SubmitExistingTrackDialog } from "@/components/SubmitExistingTrackDialog";
import { StageNavigator } from "@/components/competition/StageNavigator";
import { ArtistProgressCard } from "@/components/competition/ArtistProgressCard";
import { FanLeaderboard } from "@/components/competition/FanLeaderboard";
import { BadgeCollection } from "@/components/competition/BadgeCollection";
import { CompetitionPhaseTimeline } from "@/components/competition/CompetitionPhaseTimeline";
import { PrizeBreakdown } from "@/components/competition/PrizeBreakdown";
import { TrustSignals } from "@/components/competition/TrustSignals";
import { differenceInDays, format } from "date-fns";

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
  status: string;
  genres: string[];
  max_submissions: number | null;
}

interface Submission {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  cover_image: string | null;
  vote_count: number;
  artist_id: string;
  status: string;
  ai_score: number | null;
  ai_analysis: any;
  ai_analyzed_at: string | null;
  profiles: { username: string };
}

export default function CompetitionDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stages, setStages] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [artistJourney, setArtistJourney] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCompetitionDetails();
      fetchStages();
      fetchSubmissions();
      if (user) {
        fetchUserVotes();
        if (userRole === 'artist') fetchArtistJourney();
      }
    }
  }, [id, user, userRole]);

  useEffect(() => {
    if (id && stages.length > 0) fetchSubmissions();
  }, [activeStage]);

  const fetchCompetitionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setCompetition(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_stages')
        .select('*')
        .eq('competition_id', id)
        .order('stage_number', { ascending: true });
      if (error) throw error;
      setStages(data || []);
      const currentStage = data?.find(s => s.status === 'active') || data?.[0];
      if (currentStage) setActiveStage(currentStage.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchArtistJourney = async () => {
    if (!user || !id) return;
    try {
      const { data } = await supabase
        .from('artist_competition_journey')
        .select('*')
        .eq('artist_id', user.id)
        .eq('competition_id', id)
        .maybeSingle();
      setArtistJourney(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      let query = supabase
        .from('submissions')
        .select(`*, profiles:artist_id (username)`)
        .eq('competition_id', id);

      if (activeStage && stages.length > 0) {
        const stageSubmissions = await supabase
          .from('stage_submissions')
          .select('submission_id')
          .eq('stage_id', activeStage)
          .eq('status', 'active');
        if (stageSubmissions.data) {
          const submissionIds = stageSubmissions.data.map(s => s.submission_id).filter(Boolean);
          if (submissionIds.length > 0) query = query.in('id', submissionIds);
        }
      }

      const { data, error } = await query.order('vote_count', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
      setSubmissionCount(data?.length || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('votes').select('submission_id').eq('voter_id', user.id);
      setUserVotes(new Set(data?.map(v => v.submission_id) || []));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to vote", variant: "destructive" });
      return;
    }
    if (!isVotingOpen()) {
      toast({ title: "Voting not available", description: "Voting is not currently open", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('vote-submission', {
        body: { submission_id: submissionId, stage_id: activeStage || undefined }
      });
      if (error) {
        let errorMessage = "Failed to record vote.";
        try {
          const errorBody = error.context ? await error.context.json() : null;
          if (errorBody?.error) errorMessage = errorBody.error;
        } catch {}
        toast({ title: "Vote failed", description: errorMessage, variant: "destructive" });
        return;
      }
      if (data?.error) {
        toast({ title: "Vote failed", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Vote recorded! 🗳️", description: "1 BAK deducted • 0.65 BAK sent to artist" });
      setUserVotes(prev => new Set([...prev, submissionId]));
      fetchSubmissions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record vote.", variant: "destructive" });
    }
  };

  const handleAnalyzeSubmission = async (submissionId: string) => {
    try {
      toast({ title: "Analyzing...", description: "AI analysis in progress" });
      const { error } = await supabase.functions.invoke('analyze-submission', { body: { submissionId } });
      if (error) throw error;
      toast({ title: "Analysis complete!", description: "AI scoring completed" });
      fetchSubmissions();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Analysis failed", variant: "destructive" });
    }
  };

  const isVotingOpen = () => {
    if (!competition?.voting_start_date || !competition?.voting_end_date) return false;
    const now = new Date();
    return now >= new Date(competition.voting_start_date) && now <= new Date(competition.voting_end_date);
  };

  const isSubmissionOpen = () => {
    if (!competition) return false;
    const now = new Date();
    return now >= new Date(competition.start_date) && now <= new Date(competition.end_date);
  };

  const getPhaseId = () => {
    if (!competition) return "submissions";
    const now = new Date();
    if (competition.status === 'completed') return "winners";
    if (now < new Date(competition.start_date)) return "submissions";
    if (now <= new Date(competition.end_date)) return "submissions";
    const vs = competition.voting_start_date ? new Date(competition.voting_start_date) : null;
    const ve = competition.voting_end_date ? new Date(competition.voting_end_date) : null;
    if (vs && now < vs) return "review";
    if (vs && ve && now >= vs && now <= ve) return "voting";
    if (ve && now > ve) return "finals";
    return "review";
  };

  const getTimeLeft = () => {
    if (!competition) return "";
    const phase = getPhaseId();
    let targetDate = competition.end_date;
    if (phase === "voting" && competition.voting_end_date) targetDate = competition.voting_end_date;
    const days = differenceInDays(new Date(targetDate), new Date());
    if (days < 0) return "Ended";
    if (days === 0) return "Ends today";
    return `${days} days left`;
  };

  const shareCompetition = () => {
    const url = getCompetitionShareUrl(id!);
    const text = `🏆 Check out "${competition?.title}" on BAK55 Talent! Win ${competition?.prize_amount} BAK!`;
    if (navigator.share) {
      navigator.share({ title: `${competition?.title} - BAK55`, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "Link copied!" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Competition not found</p>
          <Link to="/competitions"><Button variant="outline" className="mt-4">Browse Competitions</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <CompetitionSEO
        competition={{
          id: competition.id,
          title: competition.title,
          description: competition.description || undefined,
          coverImage: competition.cover_image || undefined,
          prizeAmount: competition.prize_amount,
          startDate: competition.start_date,
          endDate: competition.end_date,
          genres: competition.genres || undefined,
          status: competition.status,
        }}
      />

      <div className="min-h-screen bg-background">
        <Navigation />

        {/* Immersive Header */}
        <section className="relative pt-20 pb-0 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={competition.cover_image || "/genesis-competition.png.jpeg"}
              alt=""
              className="w-full h-full object-cover blur-3xl opacity-15 scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background z-0" />

          <div className="container mx-auto max-w-5xl px-4 relative z-10">
            <Link to="/competitions">
              <Button variant="ghost" size="sm" className="mb-4 text-xs">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Competitions
              </Button>
            </Link>

            {/* Cover Image */}
            {competition.cover_image && (
              <div className="rounded-xl overflow-hidden mb-5 aspect-video max-h-[300px] sm:max-h-[360px]">
                <img
                  src={competition.cover_image}
                  alt={competition.title}
                  className="w-full h-full object-contain bg-black/10"
                />
              </div>
            )}

            {/* Title + Meta */}
            <div className="space-y-3 mb-5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{competition.title}</h1>
              {competition.description && (
                <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">{competition.description}</p>
              )}
              {competition.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {competition.genres.map((g) => <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>)}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="text-center p-2.5 rounded-lg bg-card/50 border border-border/50">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Prize</div>
                <div className="text-sm font-bold">{competition.prize_amount.toLocaleString()} BAK</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-card/50 border border-border/50">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Entries</div>
                <div className="text-sm font-bold">{submissionCount}/{competition.max_submissions || "∞"}</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-card/50 border border-border/50">
                <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Time</div>
                <div className="text-sm font-bold">{getTimeLeft()}</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-card/50 border border-border/50">
                <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Judging</div>
                <div className="text-sm font-bold">70/30</div>
              </div>
            </div>

            {/* Phase Timeline */}
            <div className="mb-5 p-4 rounded-lg bg-card/50 border border-border/50">
              <CompetitionPhaseTimeline currentPhase={getPhaseId()} />
            </div>

            {/* Smart CTA */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              {isSubmissionOpen() && (userRole === 'artist' || userRole === 'brand') && (
                <>
                  <Link to={`/artist/upload?competition=${id}`} className="flex-1">
                    <Button variant="hero" className="w-full">
                      <Music className="mr-2 h-4 w-4" /> Upload & Submit
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1" onClick={() => setSubmitDialogOpen(true)}>
                    <Music className="mr-2 h-4 w-4" /> Submit Existing Track
                  </Button>
                </>
              )}
              {isVotingOpen() && (
                <Link to="/rising-stars/voting" className="flex-1">
                  <Button variant="hero" className="w-full">
                    <Heart className="mr-2 h-4 w-4" /> Vote Now
                  </Button>
                </Link>
              )}
              <Button variant="outline" onClick={shareCompetition}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <div className="container mx-auto max-w-5xl px-4 pb-12">
          {userRole === 'admin' && (
            <div className="mb-6"><JudgeCompetition competitionId={id!} /></div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs sm:text-sm">Entries</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">Rankings</TabsTrigger>
              <TabsTrigger value="badges" className="text-xs sm:text-sm">Badges</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Prize Breakdown */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" /> Prize Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PrizeBreakdown totalPrize={competition.prize_amount} />
                </CardContent>
              </Card>

              {/* Stage Navigator */}
              {stages.length > 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Competition Stages</CardTitle>
                    <CardDescription className="text-xs">Track progress through each phase</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StageNavigator competitionId={id!} />
                  </CardContent>
                </Card>
              )}

              {/* Artist Journey */}
              {userRole === 'artist' && artistJourney && (
                <Card className="bg-card/50 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Your Journey</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ArtistProgressCard competitionId={id!} limit={10} />
                  </CardContent>
                </Card>
              )}

              {/* Scoring Model */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">How Scoring Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Heart className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Fan Voting — 70%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        1 BAK per vote. Unlimited votes. 65% of each vote goes directly to the artist.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-sm">AI Judge — 30%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Production quality, vocal strength, commercial readiness, and originality.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <TrustSignals />

              {/* Rules */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Submit original tracks during the submission period</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Each vote costs 1 BAK — 65% goes to the artist</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Results: 70% fan votes + 30% AI judge score</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Self-voting limited to 10/day per artist</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Fraud detection active — suspicious votes invalidated</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submissions</span>
                    <span className="font-medium">
                      {format(new Date(competition.start_date), 'MMM d')} – {format(new Date(competition.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {competition.voting_start_date && competition.voting_end_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Voting</span>
                      <span className="font-medium">
                        {format(new Date(competition.voting_start_date), 'MMM d')} – {format(new Date(competition.voting_end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions">
              {stages.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <Button variant={activeStage === null ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveStage(null)}>
                    All Stages
                  </Button>
                  {stages.map((stage) => (
                    <Button key={stage.id} variant={activeStage === stage.id ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveStage(stage.id)}>
                      {stage.stage_name}
                    </Button>
                  ))}
                </div>
              )}

              <h2 className="text-lg font-bold mb-4">Entries ({submissions.length})</h2>

              {submissions.length === 0 ? (
                <Card className="bg-card/50">
                  <CardContent className="py-12 text-center">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="font-medium mb-1">No submissions yet</p>
                    <p className="text-xs text-muted-foreground">Be the first to enter!</p>
                    {isSubmissionOpen() && userRole === 'artist' && (
                      <Link to={`/artist/upload?competition=${id}`}>
                        <Button className="mt-4" size="sm">Submit Your Track</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {submissions.map((submission, index) => (
                    <Card key={submission.id} className="bg-card/50 border-border/50">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                          </div>
                          {submission.cover_image && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img src={submission.cover_image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{submission.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{submission.profiles?.username || 'Unknown'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-bold text-primary">{submission.vote_count}</div>
                              <div className="text-[9px] text-muted-foreground">votes</div>
                            </div>
                            {submission.ai_score !== null && (
                              <Badge variant="outline" className="text-[10px]">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />{submission.ai_score.toFixed(0)}
                              </Badge>
                            )}
                            {isVotingOpen() && (
                              <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleVote(submission.id)}>
                                <Heart className="h-3 w-3 mr-1" /> Vote
                              </Button>
                            )}
                            {userRole === 'admin' && !submission.ai_analyzed_at && (
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleAnalyzeSubmission(submission.id)}>
                                <Sparkles className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {submission.audio_url && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <audio controls className="w-full h-8" preload="none">
                              <source src={submission.audio_url} type="audio/mpeg" />
                            </audio>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" /> Top Fans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FanLeaderboard competitionId={id!} />
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" /> Artist Rankings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {submissions.slice(0, 10).map((submission, index) => (
                        <div key={submission.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                              index === 0 ? 'bg-primary/20 text-primary' :
                              index === 1 ? 'bg-muted text-muted-foreground' :
                              index === 2 ? 'bg-accent/20 text-accent' : 'bg-muted/50'
                            }`}>
                              <span className="text-xs font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{submission.profiles?.username}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{submission.title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{submission.vote_count}</p>
                            {submission.ai_score && (
                              <p className="text-[10px] text-muted-foreground">AI: {submission.ai_score.toFixed(0)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="badges">
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Fan Badges
                  </CardTitle>
                  <CardDescription className="text-xs">Earn badges by voting and supporting artists</CardDescription>
                </CardHeader>
                <CardContent>
                  <BadgeCollection />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <SubmitExistingTrackDialog
          mode="select-track"
          competitionId={id}
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
          onSuccess={fetchSubmissions}
        />
      </div>
    </>
  );
}
