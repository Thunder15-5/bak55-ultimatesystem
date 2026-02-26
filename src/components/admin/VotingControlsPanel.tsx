import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Eye, EyeOff, RotateCcw, BarChart3, Loader2, Music } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VotingSubmission {
  id: string;
  title: string;
  artist_id: string;
  artist_username: string;
  vote_count: number;
  voting_enabled: boolean;
  moderation_status: string;
  competition_title: string;
}

export function VotingControlsPanel() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin', 'voting-controls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id, title, artist_id, vote_count, voting_enabled, moderation_status,
          competitions (title),
          profiles:artist_id (username)
        `)
        .eq('moderation_status', 'approved')
        .order('vote_count', { ascending: false });

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        artist_id: s.artist_id,
        artist_username: s.profiles?.username || 'Unknown',
        vote_count: s.vote_count || 0,
        voting_enabled: s.voting_enabled ?? true,
        moderation_status: s.moderation_status,
        competition_title: s.competitions?.title || 'Unknown',
      }));
    },
  });

  const toggleVoting = async (submissionId: string, currentState: boolean) => {
    setProcessingId(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ voting_enabled: !currentState })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(`Voting ${!currentState ? 'enabled' : 'disabled'} for this song`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'voting-controls'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update voting status');
    } finally {
      setProcessingId(null);
    }
  };

  const resetVotes = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      // Delete all votes for this submission
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('submission_id', submissionId);

      if (votesError) throw votesError;

      // Reset vote count
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ vote_count: 0 })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      toast.success('Vote count reset to 0');
      queryClient.invalidateQueries({ queryKey: ['admin', 'voting-controls'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset votes');
    } finally {
      setProcessingId(null);
    }
  };

  const removeFromVoting = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ voting_enabled: false, moderation_status: 'rejected' })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Song removed from voting page');
      queryClient.invalidateQueries({ queryKey: ['admin', 'voting-controls'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove song');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            Voting Controls ({submissions.length} songs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{submissions.length}</div>
                <div className="text-sm text-muted-foreground">Total Approved</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {submissions.filter(s => s.voting_enabled).length}
                </div>
                <div className="text-sm text-muted-foreground">Voting Active</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary">
                  {submissions.reduce((sum, s) => sum + s.vote_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No approved submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        submissions.map((submission, index) => (
          <Card key={submission.id} className={processingId === submission.id ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-muted-foreground w-8">#{index + 1}</span>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{submission.title}</h4>
                  <p className="text-sm text-muted-foreground">{submission.artist_username}</p>
                  <Badge variant="outline" className="text-xs mt-1">{submission.competition_title}</Badge>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{submission.vote_count}</div>
                  <div className="text-xs text-muted-foreground">votes</div>
                </div>

                {/* Voting Toggle */}
                <div className="flex items-center gap-2">
                  {submission.voting_enabled ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={submission.voting_enabled}
                    onCheckedChange={() => toggleVoting(submission.id, submission.voting_enabled)}
                    disabled={processingId === submission.id}
                  />
                </div>

                {/* Reset Votes */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={processingId === submission.id}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset votes for "{submission.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all {submission.vote_count} votes and reset the counter to 0. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => resetVotes(submission.id)}>
                        Reset Votes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Remove from Voting */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={processingId === submission.id}>
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove "{submission.title}" from voting?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This song will be removed from the voting page and its status set to rejected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeFromVoting(submission.id)} className="bg-destructive text-destructive-foreground">
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
