import { useEffect, useState } from "react";
import { getArtistShareUrl } from "@/lib/shareUrl";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Heart, Music, Crown, Medal, Award, Loader2, Share2, Coins } from "lucide-react";

interface VotingSubmission {
  id: string;
  title: string;
  audio_url: string;
  cover_image: string | null;
  vote_count: number;
  artist_id: string;
  competition_id: string;
  artist_username: string;
  artist_avatar: string | null;
  competition_title: string;
}

export default function RisingStarsVoting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<VotingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingSubmission, setVotingSubmission] = useState<string | null>(null);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    fetchApprovedSubmissions();
  }, []);

  // Real-time vote updates
  useEffect(() => {
    const channel = supabase
      .channel('rising-stars-votes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        () => fetchApprovedSubmissions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchApprovedSubmissions = async () => {
    try {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select(`
          id, title, audio_url, cover_image, vote_count, artist_id, competition_id,
          competitions!inner (title, status)
        `)
        .eq('moderation_status', 'approved')
        .eq('status', 'approved')
        .eq('voting_enabled', true)
        .order('vote_count', { ascending: false });

      if (error) throw error;

      const activeSubmissions = (subs || []).filter(
        (s: any) => s.competitions?.status === 'active'
      );

      const artistIds = [...new Set(activeSubmissions.map((s: any) => s.artist_id))];
      const safeIds = artistIds.length > 0 ? artistIds : ['none'];

      const [{ data: profiles }, { data: artistProfiles }] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', safeIds),
        supabase.from('artist_profiles').select('user_id, stage_name').in('user_id', safeIds),
      ]);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const artistProfileMap = new Map(artistProfiles?.map(a => [a.user_id, a]) || []);

      const formatted: VotingSubmission[] = activeSubmissions.map((s: any) => {
        const profile = profileMap.get(s.artist_id);
        const artistProfile = artistProfileMap.get(s.artist_id);
        const artistName = artistProfile?.stage_name || profile?.display_name || profile?.username || 'Unknown Artist';
        return {
          id: s.id,
          title: s.title,
          audio_url: s.audio_url,
          cover_image: s.cover_image,
          vote_count: s.vote_count || 0,
          artist_id: s.artist_id,
          competition_id: s.competition_id,
          artist_username: artistName,
          artist_avatar: profile?.avatar_url || null,
          competition_title: s.competitions?.title || 'Rising Stars',
        };
      });

      setSubmissions(formatted);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!user) {
      navigate(`/login?redirect=/rising-stars/voting`);
      return;
    }

    if (votingSubmission) return; // Prevent double-click

    setVotingSubmission(submissionId);
    try {
      const { data, error } = await supabase.functions.invoke('vote-submission', {
        body: { submission_id: submissionId }
      });

      if (error) {
        let errorBody: any = null;
        try {
          errorBody = error.context ? await error.context.json() : null;
        } catch {}

        // Check for insufficient balance
        if (errorBody?.code === 'INSUFFICIENT_BALANCE') {
          setCurrentBalance(errorBody.current_balance ?? 0);
          setShowInsufficientDialog(true);
          return;
        }

        toast({
          title: "Vote failed",
          description: errorBody?.error || "Failed to record vote.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        if (data.code === 'INSUFFICIENT_BALANCE') {
          setCurrentBalance(data.current_balance ?? 0);
          setShowInsufficientDialog(true);
          return;
        }
        toast({ title: "Vote failed", description: data.error, variant: "destructive" });
        return;
      }

      toast({
        title: "Vote recorded! 🗳️",
        description: `1 BAK deducted. New balance: ${data?.new_balance?.toFixed(2) ?? '—'} BAK`,
      });

      fetchApprovedSubmissions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record vote.", variant: "destructive" });
    } finally {
      setVotingSubmission(null);
    }
  };

  const handleShare = (submission: VotingSubmission) => {
    const url = `${window.location.origin}/artist/${submission.artist_id}`;
    const text = `Vote for "${submission.title}" by ${submission.artist_username} on BAK55 Rising Stars! 🌟`;
    if (navigator.share) {
      navigator.share({ title: `${submission.title} - BAK55 Rising Stars`, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "Link copied!", description: "Share it with friends to support this artist." });
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Insufficient BAKCoins Dialog */}
      <Dialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-secondary" />
              Insufficient BAKCoins
            </DialogTitle>
            <DialogDescription>
              You don't have enough BAKCoins to vote. Each vote costs 1 BAK.
              Your current balance is <strong>{currentBalance.toFixed(2)} BAK</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowInsufficientDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-secondary"
              onClick={() => {
                setShowInsufficientDialog(false);
                navigate('/buy-coins');
              }}
            >
              <Coins className="h-4 w-4 mr-2" />
              Buy BAKCoins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <div className="relative bg-gradient-radial from-secondary/10 via-background to-background border-b border-secondary/10">
        <div className="container mx-auto px-4 py-12 pt-32">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 animate-fade-in">
              <Trophy className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Live Voting</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-tight animate-fade-in">
              Rising <span className="text-gradient-secondary">Stars</span> Voting
            </h1>
            <p className="text-lg text-muted-foreground animate-fade-in max-w-2xl mx-auto">
              Vote for your favorite artists! Each vote costs 1 BAK — 65% goes directly to the artist. Vote as many times as you want!
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Badge variant="outline" className="text-sm px-4 py-1">
                <Music className="h-3 w-3 mr-1" /> {submissions.length} Songs
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-1">
                <Heart className="h-3 w-3 mr-1" /> Unlimited Voting
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="container mx-auto px-4 py-8">
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No songs are live for voting yet</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon — approved songs will appear here automatically!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-secondary" />
                Leaderboard
              </h2>
              <Badge variant="secondary" className="text-sm">Top {Math.min(submissions.length, 10)}</Badge>
            </div>

            {submissions.slice(0, 10).map((submission, index) => {
              const isTop3 = index < 3;

              return (
                <Card
                  key={submission.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-elegant ${
                    isTop3
                      ? 'border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent'
                      : 'border-primary/10 hover:border-primary/30'
                  }`}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>

                      {/* Cover Image */}
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted">
                        {submission.cover_image ? (
                          <img src={submission.cover_image} alt={submission.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-sm sm:text-lg">{submission.title}</h3>
                        <Link
                          to={`/artist/${submission.artist_id}`}
                          className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block truncate"
                        >
                          {submission.artist_username}
                        </Link>
                        <Badge variant="outline" className="text-[10px] mt-1 hidden sm:inline-flex max-w-[200px] truncate">
                          {submission.competition_title}
                        </Badge>
                      </div>

                      {/* Vote Count + Actions */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className="text-xl sm:text-3xl font-bold text-primary leading-none">{submission.vote_count}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">votes</div>
                        <Button
                          size="sm"
                          disabled={votingSubmission === submission.id}
                          onClick={() => handleVote(submission.id)}
                          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-8 px-3 text-xs mt-1"
                        >
                          {votingSubmission === submission.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Heart className="h-3 w-3 mr-1" />
                              Vote
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShare(submission)}
                          className="text-[10px] h-6 px-2"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {submission.audio_url && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50">
                        <audio controls className="w-full h-8" preload="none">
                          <source src={submission.audio_url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Remaining submissions beyond top 10 */}
            {submissions.length > 10 && (
              <div className="pt-4">
                <h3 className="text-lg font-semibold text-muted-foreground mb-3">Other Entries</h3>
                {submissions.slice(10).map((submission, idx) => (
                  <Card key={submission.id} className="mb-3 border-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-muted-foreground w-8">#{idx + 11}</span>
                        <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-muted">
                          {submission.cover_image ? (
                            <img src={submission.cover_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-muted-foreground" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">{submission.artist_username}</p>
                        </div>
                        <span className="font-bold text-primary">{submission.vote_count}</span>
                        <Button
                          size="sm"
                          disabled={votingSubmission === submission.id}
                          onClick={() => handleVote(submission.id)}
                          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        >
                          {votingSubmission === submission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
