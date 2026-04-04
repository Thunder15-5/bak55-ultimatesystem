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
import { SuccessState } from "@/components/SuccessState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Heart, Music, Crown, Medal, Award, Loader2, Share2, Coins, Play, Pause } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

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
  const [justVoted, setJustVoted] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovedSubmissions();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('rising-stars-votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchApprovedSubmissions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchApprovedSubmissions = async () => {
    try {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select(`id, title, audio_url, cover_image, vote_count, artist_id, competition_id, competitions!inner (title, status)`)
        .eq('moderation_status', 'approved')
        .eq('status', 'approved')
        .eq('voting_enabled', true)
        .order('vote_count', { ascending: false });

      if (error) throw error;

      const activeSubmissions = (subs || []).filter((s: any) => s.competitions?.status === 'active');
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
        return {
          id: s.id,
          title: s.title,
          audio_url: s.audio_url,
          cover_image: s.cover_image,
          vote_count: s.vote_count || 0,
          artist_id: s.artist_id,
          competition_id: s.competition_id,
          artist_username: artistProfile?.stage_name || profile?.display_name || profile?.username || 'Unknown Artist',
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
    if (votingSubmission) return;

    setVotingSubmission(submissionId);
    try {
      const { data, error } = await supabase.functions.invoke('vote-submission', {
        body: { submission_id: submissionId }
      });

      if (error) {
        let errorBody: any = null;
        try { errorBody = error.context ? await error.context.json() : null; } catch {}
        if (errorBody?.code === 'INSUFFICIENT_BALANCE') {
          setCurrentBalance(errorBody.current_balance ?? 0);
          setShowInsufficientDialog(true);
          return;
        }
        toast({ title: "Vote failed", description: errorBody?.error || "Failed to record vote.", variant: "destructive" });
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

      // Show success feedback
      setJustVoted(submissionId);
      setTimeout(() => setJustVoted(null), 2000);

      toast({
        title: "Vote recorded! 🗳️",
        description: `1 BAK deducted • 0.65 BAK sent to artist`,
      });

      fetchApprovedSubmissions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record vote.", variant: "destructive" });
    } finally {
      setVotingSubmission(null);
    }
  };

  const handleShare = (submission: VotingSubmission) => {
    const url = getArtistShareUrl(submission.artist_id);
    const text = `Vote for "${submission.title}" by ${submission.artist_username} on BAK55! 🌟`;
    if (navigator.share) {
      navigator.share({ title: `${submission.title} - BAK55`, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "Link copied!", description: "Share it with friends to support this artist." });
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center"><Crown className="h-4 w-4 text-primary" /></div>;
    if (index === 1) return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Medal className="h-4 w-4 text-muted-foreground" /></div>;
    if (index === 2) return <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"><Award className="h-4 w-4 text-accent" /></div>;
    return <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"><span className="text-xs font-bold text-muted-foreground">{index + 1}</span></div>;
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
              <Coins className="h-5 w-5 text-primary" />
              Need More BAKCoins
            </DialogTitle>
            <DialogDescription>
              Each vote costs 1 BAK. Your balance: <strong>{currentBalance.toFixed(2)} BAK</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowInsufficientDialog(false)}>Cancel</Button>
            <Button onClick={() => { setShowInsufficientDialog(false); navigate('/buy-coins'); }}>
              <Coins className="h-4 w-4 mr-2" />
              Buy BAKCoins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compact Hero */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 pt-24 pb-6">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <Badge variant="outline" className="text-xs">
              <Trophy className="w-3 h-3 mr-1" /> Live Voting
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold">
              Rising <span className="text-gradient">Stars</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Vote for your favorites — 1 BAK per vote, 65% goes directly to the artist
            </p>
            <div className="flex justify-center gap-3">
              <Badge variant="secondary" className="text-xs">
                <Music className="h-3 w-3 mr-1" /> {submissions.length} entries
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Heart className="h-3 w-3 mr-1" /> Unlimited votes
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No songs live for voting yet</p>
                <p className="text-xs text-muted-foreground mt-1">Approved songs will appear here automatically</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission, index) => {
                const isTop3 = index < 3;
                const wasJustVoted = justVoted === submission.id;

                return (
                  <Card
                    key={submission.id}
                    className={`transition-all duration-300 ${
                      wasJustVoted ? 'ring-2 ring-primary/50 scale-[1.01]' : ''
                    } ${isTop3 ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-transparent' : 'border-border/50'}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className="flex-shrink-0">{getRankBadge(index)}</div>

                        {/* Cover */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
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
                          <h3 className="font-semibold text-sm truncate">{submission.title}</h3>
                          <Link
                            to={`/artist/${submission.artist_id}`}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
                          >
                            {submission.artist_username}
                          </Link>
                        </div>

                        {/* Votes + Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right mr-1">
                            <div className="text-lg font-bold text-primary leading-none">{submission.vote_count}</div>
                            <div className="text-[9px] text-muted-foreground">votes</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              disabled={votingSubmission === submission.id}
                              onClick={() => handleVote(submission.id)}
                              className="h-8 px-3 text-xs"
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
                              className="h-6 px-2 text-[10px]"
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Audio */}
                      {submission.audio_url && (
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <audio controls className="w-full h-8" preload="none">
                            <source src={submission.audio_url} type="audio/mpeg" />
                          </audio>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
