import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CompetitionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [myTracks, setMyTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('');

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    // Fetch competition details
    const { data: compData } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();
    setCompetition(compData);

    // Fetch submissions with votes
    const { data: submissionsData } = await supabase
      .from('submissions')
      .select(`
        *,
        artist:artist_profiles(stage_name),
        track:tracks(title, audio_url)
      `)
      .eq('competition_id', id)
      .order('vote_count', { ascending: false });
    setSubmissions(submissionsData || []);

    // Fetch user's tracks
    const { data: tracksData } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', user!.id);
    setMyTracks(tracksData || []);
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      toast.error('Please select a track');
      return;
    }

    const { error } = await supabase.from('submissions').insert({
      competition_id: id,
      artist_id: user!.id,
      track_id: selectedTrack,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Track submitted successfully!');
      fetchData();
    }
  };

  const handleVote = async (submissionId: string) => {
    const { error } = await supabase.from('votes').insert({
      submission_id: submissionId,
      user_id: user!.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Vote recorded!');
      fetchData();
    }
  };

  if (!competition) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-gradient mb-4">{competition.title}</h1>
        <p className="text-muted-foreground mb-8">{competition.description}</p>

        {myTracks.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">Submit Your Track</h2>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="w-full p-2 rounded bg-card border border-border mb-4"
            >
              <option value="">Select a track</option>
              {myTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
            <Button onClick={handleSubmit}>Submit Track</Button>
          </Card>
        )}

        <h2 className="text-2xl font-bold text-secondary mb-4">Leaderboard</h2>
        <div className="space-y-4">
          {submissions.map((submission, index) => (
            <Card key={submission.id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gradient">#{index + 1}</span>
                  <div>
                    <h3 className="font-bold text-foreground">{submission.track?.title}</h3>
                    <p className="text-muted-foreground">{submission.artist?.stage_name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-foreground">{submission.vote_count} votes</p>
                  {submission.ai_score && (
                    <p className="text-sm text-muted-foreground">AI Score: {submission.ai_score}</p>
                  )}
                </div>
                <Button onClick={() => handleVote(submission.id)}>Vote</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
