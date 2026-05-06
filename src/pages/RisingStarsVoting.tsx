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
import { TrustSignals } from "@/components/competition/TrustSignals";
import { VoteReceipt } from "@/components/trust/VoteReceipt";
import { RuleCard } from "@/components/trust/RuleCard";
import { FairnessBreakdown } from "@/components/trust/FairnessBreakdown";
import { VoteSheet } from "@/components/voting/VoteSheet";
import { CheerAgainBar } from "@/components/voting/CheerAgainBar";
import type { VoteSuccessData } from "@/components/voting/VoteSuccessState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Heart, Music, Crown, Medal, Award, Loader2, Share2, Coins, ShieldCheck, TrendingUp, Users } from "lucide-react";

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
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<{ title: string; artist: string; voteId?: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<VotingSubmission | null>(null);
  const [lastSupport, setLastSupport] = useState<{ submission: VotingSubmission; quantity: number } | null>(null);

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

  const openVoteSheet = (submissionId: string) => {
    if (!user) {
      navigate(`/login?redirect=/rising-stars/voting`);
      return;
    }
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    setActiveSubmission(sub);
    setSheetOpen(true);
  };

  const handleVoted = (data: VoteSuccessData) => {
    if (!activeSubmission) return;
    setJustVoted(activeSubmission.id);
    setTimeout(() => setJustVoted(null), 2000);
    setLastSupport({ submission: activeSubmission, quantity: data.quantity });
    fetchApprovedSubmissions();
  };

  const handleCheerAgain = () => {
    if (!lastSupport) return;
    setActiveSubmission(lastSupport.submission);
    setSheetOpen(true);
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

  const totalVotes = submissions.reduce((sum, s) => sum + s.vote_count, 0);

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

      {/* Vote Sheet */}
      {activeSubmission && (
        <VoteSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          submissionId={activeSubmission.id}
          artistId={activeSubmission.artist_id}
          artistName={activeSubmission.artist_username}
          artistAvatar={activeSubmission.artist_avatar}
          trackTitle={activeSubmission.title}
          competitionTitle={activeSubmission.competition_title}
          currentVotes={activeSubmission.vote_count}
          onVoted={handleVoted}
        />
      )}

      {/* Floating Cheer Again bar */}
      {lastSupport && !sheetOpen && (
        <CheerAgainBar
          artistName={lastSupport.submission.artist_username}
          artistAvatar={lastSupport.submission.artist_avatar}
          lastQuantity={lastSupport.quantity}
          onCheer={handleCheerAgain}
        />
      )}

      {/* Hero */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 pt-24 pb-5">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <Badge variant="outline" className="text-xs gap-1">
              <Trophy className="w-3 h-3" /> Live Voting
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold">
              Rising <span className="text-gradient">Stars</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Vote for your favorites — 1 BAK per vote, 65% goes directly to the artist
            </p>

            {/* Live Stats */}
            <div className="flex justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Music className="h-3 w-3" />
                <span className="font-medium">{submissions.length} entries</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Heart className="h-3 w-3" />
                <span className="font-medium">{totalVotes.toLocaleString()} votes cast</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                <span className="font-medium">Fair voting</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Podium (Top 3) */}
      {submissions.length >= 3 && (
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* 2nd Place */}
              <div className="order-1 pt-4">
                <PodiumCard submission={submissions[1]} rank={2} onVote={openVoteSheet} onShare={handleShare} votingId={null} justVoted={justVoted} />
              </div>
              {/* 1st Place */}
              <div className="order-2">
                <PodiumCard submission={submissions[0]} rank={1} onVote={openVoteSheet} onShare={handleShare} votingId={null} justVoted={justVoted} />
              </div>
              {/* 3rd Place */}
              <div className="order-3 pt-6">
                <PodiumCard submission={submissions[2]} rank={3} onVote={openVoteSheet} onShare={handleShare} votingId={null} justVoted={justVoted} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="container mx-auto px-4 py-4 pb-8">
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
            <>
              {submissions.length > 3 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" /> Full Rankings
                  </h3>
                  {submissions.slice(3).map((submission, index) => {
                    const rank = index + 4;
                    const wasJustVoted = justVoted === submission.id;

                    return (
                      <Card
                        key={submission.id}
                        className={`transition-all duration-300 border-border/50 ${
                          wasJustVoted ? 'ring-2 ring-primary/50 scale-[1.01]' : ''
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Rank */}
                            <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                            </div>

                            {/* Cover */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {submission.cover_image ? (
                                <img src={submission.cover_image} alt={submission.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music className="h-4 w-4 text-muted-foreground" />
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

                            {/* Votes + Vote button */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-bold text-primary leading-none">{submission.vote_count}</div>
                                <div className="text-[9px] text-muted-foreground">votes</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openVoteSheet(submission.id)}
                                className="h-8 px-3 text-xs"
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                Vote
                              </Button>
                                )}
                              </Button>
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

              {/* Trust section */}
              <div className="mt-8 space-y-4">
                <FairnessBreakdown />
                <RuleCard
                  title="Voting Rules"
                  subtitle="Read this once. Vote with confidence."
                  rules={[
                    { label: "Cost per vote", value: "1 BAK", hint: "0.65 BAK goes to the artist" },
                    { label: "Self-vote daily cap", value: "10 / day" },
                    { label: "Per-submission rate limit", value: "50 / hour" },
                    { label: "Final score weighting", value: "70% fan · 30% AI" },
                    { label: "Fraud review window", value: "7 days post-finals" },
                  ]}
                />
                <TrustSignals />
              </div>
            </>
          )}
        </div>
      </div>

      <VoteReceipt
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        submissionTitle={receiptInfo?.title}
        artistName={receiptInfo?.artist}
        voteId={receiptInfo?.voteId}
      />
    </div>
  );
}

// Podium card for top 3
function PodiumCard({
  submission,
  rank,
  onVote,
  onShare,
  votingId,
  justVoted,
}: {
  submission: VotingSubmission;
  rank: 1 | 2 | 3;
  onVote: (id: string) => void;
  onShare: (s: VotingSubmission) => void;
  votingId: string | null;
  justVoted: string | null;
}) {
  const isVoting = votingId === submission.id;
  const wasJustVoted = justVoted === submission.id;

  const rankConfig = {
    1: { icon: Crown, border: "border-primary/40 ring-2 ring-primary/20", bg: "from-primary/10 to-transparent", iconColor: "text-primary" },
    2: { icon: Medal, border: "border-muted-foreground/30", bg: "from-muted/30 to-transparent", iconColor: "text-muted-foreground" },
    3: { icon: Award, border: "border-accent/30", bg: "from-accent/10 to-transparent", iconColor: "text-accent" },
  }[rank];

  const RankIcon = rankConfig.icon;

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${rankConfig.border} bg-gradient-to-b ${rankConfig.bg} ${
      wasJustVoted ? 'scale-[1.03]' : ''
    }`}>
      <div className="p-3 text-center space-y-2">
        {/* Rank icon */}
        <RankIcon className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto ${rankConfig.iconColor}`} />

        {/* Avatar */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full overflow-hidden bg-muted border-2 border-background">
          {submission.artist_avatar ? (
            <img src={submission.artist_avatar} alt={submission.artist_username} className="w-full h-full object-cover" />
          ) : submission.cover_image ? (
            <img src={submission.cover_image} alt={submission.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="font-semibold text-xs sm:text-sm truncate">{submission.title}</h3>
          <Link to={`/artist/${submission.artist_id}`} className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary truncate block">
            {submission.artist_username}
          </Link>
        </div>

        {/* Votes */}
        <div>
          <div className="text-lg sm:text-xl font-bold text-primary">{submission.vote_count}</div>
          <div className="text-[9px] text-muted-foreground">votes</div>
        </div>

        {/* Vote Button */}
        <Button
          size="sm"
          disabled={isVoting}
          onClick={() => onVote(submission.id)}
          className="w-full h-8 text-xs"
        >
          {isVoting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <Heart className="h-3 w-3 mr-1" />
              Vote
            </>
          )}
        </Button>

        {/* Share */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onShare(submission)}
          className="w-full h-6 text-[10px] text-muted-foreground"
        >
          <Share2 className="h-3 w-3 mr-1" />
          Share
        </Button>

        {/* Audio */}
        {submission.audio_url && (
          <div className="pt-1 border-t border-border/30">
            <audio controls className="w-full h-7" preload="none" style={{ minWidth: 0 }}>
              <source src={submission.audio_url} type="audio/mpeg" />
            </audio>
          </div>
        )}
      </div>
    </Card>
  );
}
