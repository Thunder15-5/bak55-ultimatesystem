import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Calendar, Coins, Music, Heart, ArrowLeft, Sparkles } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { JudgeCompetition } from "@/components/JudgeCompetition";
import { SubmitExistingTrackDialog } from "@/components/SubmitExistingTrackDialog";

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
  profiles: {
    username: string;
  };
}

export default function CompetitionDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompetitionDetails();
      fetchSubmissions();
      if (user) fetchUserVotes();
    }
  }, [id, user]);

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
      console.error('Error fetching competition:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:artist_id (username)
        `)
        .eq('competition_id', id)
        .order('vote_count', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('submission_id')
        .eq('voter_id', user.id);

      if (error) throw error;
      setUserVotes(new Set(data?.map(v => v.submission_id) || []));
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to vote for submissions",
        variant: "destructive",
      });
      return;
    }

    const VOTE_COST = 1; // 1 BAKCoin per vote

    try {
      // Check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .single();

      if (walletError || !wallet) {
        toast({
          title: "Wallet Error",
          description: "Unable to access your wallet",
          variant: "destructive",
        });
        return;
      }

      if (wallet.balance < VOTE_COST) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${VOTE_COST} BAKCoin to vote. Current balance: ${wallet.balance.toFixed(2)} BAK`,
          variant: "destructive",
        });
        return;
      }

      // Record vote
      const { error } = await supabase
        .from('votes')
        .insert({
          submission_id: submissionId,
          voter_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already voted",
            description: "You've already voted for this submission",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Deduct vote cost from wallet
      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance - VOTE_COST })
        .eq("id", wallet.id);

      if (walletUpdateError) {
        throw walletUpdateError;
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        wallet_id: wallet.id,
        amount: -VOTE_COST,
        type: "purchase",
        description: `Vote in competition`,
        reference_id: submissionId,
      });

      toast({
        title: "Vote recorded!",
        description: `Your vote has been counted. ${VOTE_COST} BAK deducted.`,
      });

      setUserVotes(prev => new Set([...prev, submissionId]));
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeSubmission = async (submissionId: string) => {
    try {
      toast({
        title: "Analyzing submission",
        description: "AI analysis in progress...",
      });

      const { error } = await supabase.functions.invoke('analyze-submission', {
        body: { submissionId }
      });

      if (error) throw error;

      toast({
        title: "Analysis complete!",
        description: "AI scoring has been completed for this submission",
      });

      fetchSubmissions();
    } catch (error: any) {
      console.error('Error analyzing submission:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze submission",
        variant: "destructive",
      });
    }
  };

  const isVotingOpen = () => {
    if (!competition?.voting_start_date || !competition?.voting_end_date) return false;
    const now = new Date();
    const start = new Date(competition.voting_start_date);
    const end = new Date(competition.voting_end_date);
    return now >= start && now <= end;
  };

  const isSubmissionOpen = () => {
    if (!competition) return false;
    const now = new Date();
    const start = new Date(competition.start_date);
    const end = new Date(competition.end_date);
    return now >= start && now <= end;
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

  if (!competition) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Competition not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={competition.cover_image || "/genesis-competition.png.jpeg"} 
            alt={competition.title}
            className="w-full h-full object-cover blur-3xl opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background z-0" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <Link to="/competitions/active">
            <Button variant="ghost" className="mb-6 hover:bg-primary/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Competitions
            </Button>
          </Link>
        </div>
      </section>
      
      <div className="container mx-auto px-4 pb-12 -mt-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {competition.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{competition.description}</p>

            {competition.genres && competition.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {competition.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">{genre}</Badge>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Competition Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <p className="text-2xl font-bold text-primary">{competition.prize_amount} BAK</p>
              </div>
              
              {competition.entry_fee > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="text-lg font-semibold">{competition.entry_fee} BAK</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Submission Period</p>
                <p className="text-sm">
                  {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
                </p>
              </div>

              {competition.voting_start_date && competition.voting_end_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Voting Period</p>
                  <p className="text-sm">
                    {new Date(competition.voting_start_date).toLocaleDateString()} - {new Date(competition.voting_end_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={isSubmissionOpen() ? "default" : "secondary"}>
                  {isSubmissionOpen() ? "Submissions Open" : isVotingOpen() ? "Voting Open" : "Closed"}
                </Badge>
              </div>

              {userRole === 'artist' && isSubmissionOpen() && (
                <div className="space-y-2">
                  <Link to={`/artist/upload?competition=${id}`} className="block">
                    <Button variant="hero" className="w-full">
                      <Music className="mr-2 h-4 w-4" />
                      Upload New Track
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSubmitDialogOpen(true)}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    Submit Existing Track
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {userRole === 'admin' && (
          <div className="mb-8">
            <JudgeCompetition competitionId={id!} />
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">Submissions ({submissions.length})</h2>
          
          {submissions.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardContent className="py-16 text-center">
                <Music className="h-16 w-16 mx-auto mb-6 text-primary/50" />
                <p className="text-xl font-semibold mb-2">No submissions yet</p>
                <p className="text-muted-foreground">Be the first to submit your track!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission, index) => (
                <Card key={submission.id} className="relative bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all group">
                  {index < 3 && submission.status === 'winner' && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-yellow-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                      </Badge>
                    </div>
                  )}
                  
                  {submission.cover_image && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={submission.cover_image} 
                        alt={submission.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{submission.title}</CardTitle>
                    <CardDescription>by {submission.profiles?.username || 'Unknown Artist'}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {submission.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{submission.description}</p>
                    )}
                    
                    <audio controls className="w-full">
                      <source src={submission.audio_url} type="audio/mpeg" />
                    </audio>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        <span>{submission.vote_count} votes</span>
                      </div>

                      {submission.ai_score !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{submission.ai_score.toFixed(1)}/100</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {isVotingOpen() && (
                        <Button
                          size="sm"
                          variant={userVotes.has(submission.id) ? "secondary" : "default"}
                          onClick={() => handleVote(submission.id)}
                          disabled={userVotes.has(submission.id)}
                          className="flex-1"
                        >
                          {userVotes.has(submission.id) ? "Voted" : "Vote"}
                        </Button>
                      )}
                      
                      {userRole === 'admin' && !submission.ai_analyzed_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyzeSubmission(submission.id)}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <SubmitExistingTrackDialog
        mode="select-track"
        competitionId={id}
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onSuccess={fetchSubmissions}
      />
    </div>
  );
}
