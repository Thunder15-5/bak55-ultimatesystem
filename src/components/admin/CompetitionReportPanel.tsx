import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, Users, Music, Trophy, AlertTriangle, Shield,
  Loader2, Download, TrendingUp, Eye, UserCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface VoteAnalysis {
  total_votes: number;
  unique_voters: number;
  self_votes: number;
  fan_votes: number;
  self_vote_percentage: number;
  top_voters: Array<{ voter_id: string; username: string; votes_cast: number; self_votes: number }>;
  submissions_by_votes: Array<{
    id: string; title: string; vote_count: number; artist_id: string;
    username: string; self_votes: number; genuine_votes: number;
  }>;
}

export function CompetitionReportPanel() {
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);

  const { data: competitions = [], isLoading: loadingComps } = useQuery({
    queryKey: ['admin', 'competitions-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, status, start_date, end_date, prize_amount, voting_start_date, voting_end_date')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: analysis, isLoading: loadingAnalysis } = useQuery({
    queryKey: ['admin', 'competition-analysis', selectedCompetition],
    queryFn: async () => {
      if (!selectedCompetition) return null;
      const { data, error } = await supabase.rpc('get_competition_vote_analysis', {
        comp_id: selectedCompetition
      });
      if (error) throw error;
      return data as unknown as VoteAnalysis;
    },
    enabled: !!selectedCompetition,
  });

  const { data: compMeta } = useQuery({
    queryKey: ['admin', 'competition-meta', selectedCompetition],
    queryFn: async () => {
      if (!selectedCompetition) return null;
      const [
        { count: submissionCount },
        { count: signupsDuring },
      ] = await Promise.all([
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', selectedCompetition),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', competitions.find(c => c.id === selectedCompetition)?.start_date || '')
          .lte('created_at', competitions.find(c => c.id === selectedCompetition)?.end_date || new Date().toISOString()),
      ]);
      return { submissionCount: submissionCount || 0, signupsDuring: signupsDuring || 0 };
    },
    enabled: !!selectedCompetition,
  });

  const handleInvalidateVotes = async (voterId: string, submissionId: string, voterName: string) => {
    if (!confirm(`Remove all votes by "${voterName}" for this submission? This cannot be undone.`)) return;
    
    const { data, error } = await supabase.rpc('admin_invalidate_votes', {
      p_voter_id: voterId,
      p_submission_id: submissionId,
      p_reason: 'Admin review: suspicious voting pattern'
    });

    if (error) {
      toast.error('Failed to invalidate votes: ' + error.message);
    } else {
      toast.success(`Removed ${(data as any)?.votes_removed || 0} votes`);
    }
  };

  const exportReport = () => {
    if (!analysis || !selectedCompetition) return;
    const comp = competitions.find(c => c.id === selectedCompetition);
    
    const report = {
      competition: comp?.title,
      generated_at: new Date().toISOString(),
      overview: {
        total_votes: analysis.total_votes,
        unique_voters: analysis.unique_voters,
        self_votes: analysis.self_votes,
        fan_votes: analysis.fan_votes,
        self_vote_percentage: analysis.self_vote_percentage,
        total_submissions: compMeta?.submissionCount,
        signups_during_competition: compMeta?.signupsDuring,
      },
      submissions: analysis.submissions_by_votes,
      top_voters: analysis.top_voters,
      integrity_assessment: {
        self_vote_ratio: analysis.self_vote_percentage > 50 ? 'HIGH_RISK' : analysis.self_vote_percentage > 25 ? 'MEDIUM_RISK' : 'LOW_RISK',
        voter_concentration: analysis.unique_voters < 10 ? 'HIGH_RISK' : 'NORMAL',
        recommendations: [
          analysis.self_vote_percentage > 50 ? 'CRITICAL: Self-voting exceeds 50%. Consider implementing stricter self-vote limits.' : null,
          analysis.unique_voters < 10 ? 'WARNING: Very few unique voters. Competition results may not reflect broad audience preference.' : null,
          'Implement daily self-vote caps for future competitions.',
          'Consider requiring email verification before voting.',
          'Add device fingerprinting to detect multi-account abuse.',
        ].filter(Boolean),
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competition-report-${comp?.title?.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const selfVotePercent = analysis?.self_vote_percentage || 0;
  const riskLevel = selfVotePercent > 50 ? 'high' : selfVotePercent > 25 ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Competition Reports & Vote Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {loadingComps ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              competitions.map(comp => (
                <Button
                  key={comp.id}
                  variant={selectedCompetition === comp.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompetition(comp.id)}
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {comp.title}
                  <Badge variant="secondary" className="ml-2 text-xs">{comp.status}</Badge>
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCompetition && loadingAnalysis && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {analysis && selectedCompetition && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{analysis.total_votes}</div>
                <div className="text-xs text-muted-foreground">Total Votes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{analysis.unique_voters}</div>
                <div className="text-xs text-muted-foreground">Unique Voters</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{analysis.fan_votes}</div>
                <div className="text-xs text-muted-foreground">Fan Votes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{analysis.self_votes}</div>
                <div className="text-xs text-muted-foreground">Self-Votes</div>
              </CardContent>
            </Card>
          </div>

          {/* Integrity Assessment */}
          <Card className={`border-${riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'yellow-500' : 'green-500'}/30`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Integrity Assessment
                <Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'default'}>
                  {riskLevel.toUpperCase()} RISK
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Self-Vote Ratio</span>
                  <span className="font-bold">{selfVotePercent.toFixed(1)}%</span>
                </div>
                <Progress value={selfVotePercent} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Voter Concentration: {analysis.unique_voters < 10 ? '⚠️ Very Low' : '✅ Normal'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>Submissions: {compMeta?.submissionCount || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Signups During: {compMeta?.signupsDuring || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Avg Votes/Voter: {(analysis.total_votes / Math.max(analysis.unique_voters, 1)).toFixed(0)}</span>
                </div>
              </div>

              {selfVotePercent > 50 && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-semibold text-sm text-destructive">Critical Finding</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selfVotePercent.toFixed(1)}% of all votes are self-votes. This severely undermines competition fairness.
                    Self-vote limits have been implemented for future competitions (max {10}/day).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Music className="h-5 w-5" />
                Submissions Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Song</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Self</TableHead>
                    <TableHead className="text-right">Genuine</TableHead>
                    <TableHead className="text-right">Self %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analysis.submissions_by_votes || []).map((sub, idx) => {
                    const selfPct = sub.vote_count > 0 ? (sub.self_votes / sub.vote_count * 100) : 0;
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-bold">#{idx + 1}</TableCell>
                        <TableCell className="font-medium">{sub.title}</TableCell>
                        <TableCell>{sub.username}</TableCell>
                        <TableCell className="text-right font-bold">{sub.vote_count}</TableCell>
                        <TableCell className="text-right text-destructive">{sub.self_votes}</TableCell>
                        <TableCell className="text-right text-green-500">{sub.genuine_votes}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={selfPct > 80 ? 'destructive' : selfPct > 50 ? 'secondary' : 'default'}>
                            {selfPct.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Voters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Top Voters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voter</TableHead>
                    <TableHead className="text-right">Total Votes</TableHead>
                    <TableHead className="text-right">Self-Votes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analysis.top_voters || []).map((voter) => (
                    <TableRow key={voter.voter_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {voter.username}
                          {voter.self_votes > 0 && (
                            <Badge variant="destructive" className="text-xs">Self-voter</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{voter.votes_cast}</TableCell>
                      <TableCell className="text-right text-destructive">{voter.self_votes}</TableCell>
                      <TableCell>
                        {voter.self_votes > 100 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const sub = analysis.submissions_by_votes?.find(s => s.artist_id === voter.voter_id);
                              if (sub) handleInvalidateVotes(voter.voter_id, sub.id, voter.username);
                            }}
                          >
                            Invalidate Self-Votes
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Export */}
          <div className="flex justify-end">
            <Button onClick={exportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Full Report (JSON)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
