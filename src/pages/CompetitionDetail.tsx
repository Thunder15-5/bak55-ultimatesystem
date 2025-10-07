import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ThumbsUp, Music, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const CompetitionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTrack, setSelectedTrack] = useState("");

  const { data: competition } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("submissions")
        .select(`
          *,
          profiles:artist_id (username),
          votes (voter_id)
        `)
        .eq("competition_id", id)
        .order("vote_count", { ascending: false });
      return data || [];
    },
  });

  const { data: userTracks } = useQuery({
    queryKey: ["user-tracks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .single();
      return data?.role;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrack) throw new Error("Please select a track");

      const track = userTracks?.find((t) => t.id === selectedTrack);
      if (!track) throw new Error("Track not found");

      const { error } = await supabase.from("submissions").insert({
        competition_id: id,
        artist_id: user!.id,
        track_id: selectedTrack,
        title: track.title,
        audio_url: track.audio_url,
        cover_image: track.cover_image,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast({ title: "Track submitted successfully!" });
      setSelectedTrack("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.from("votes").insert({
        submission_id: submissionId,
        voter_id: user!.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast({ title: "Vote recorded!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasVoted = (submission: any) => {
    return submission.votes?.some((v: any) => v.voter_id === user?.id);
  };

  if (!competition) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {competition.cover_image && (
            <div className="w-full h-64 rounded-lg overflow-hidden mb-6">
              <img
                src={competition.cover_image}
                alt={competition.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Trophy className="w-10 h-10 text-primary" />
                {competition.title}
              </h1>
              <p className="text-muted-foreground mb-4">{competition.description}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-primary font-semibold">
                  Prize: {competition.prize_amount} BAK
                </span>
                {competition.entry_fee && competition.entry_fee > 0 && (
                  <span className="text-muted-foreground">
                    Entry Fee: {competition.entry_fee} BAK
                  </span>
                )}
              </div>
            </div>

            {userRole === "artist" && competition.status === "active" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Music className="w-4 h-4" />
                    Submit Track
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Your Track</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a track" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTracks?.map((track) => (
                          <SelectItem key={track.id} value={track.id}>
                            {track.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => submitMutation.mutate()}
                      disabled={!selectedTrack || submitMutation.isPending}
                      className="w-full"
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Leaderboard
          </h2>

          <div className="space-y-4">
            {submissions?.map((submission, index) => (
              <Card key={submission.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{submission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        by {submission.profiles?.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {submission.vote_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">votes</p>
                    </div>

                    {user && !hasVoted(submission) && submission.artist_id !== user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => voteMutation.mutate(submission.id)}
                        disabled={voteMutation.isPending}
                        className="gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Vote
                      </Button>
                    )}

                    {hasVoted(submission) && (
                      <div className="text-sm text-primary font-semibold">Voted ✓</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {submissions?.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
                <p className="text-muted-foreground">Be the first to submit a track!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetail;
