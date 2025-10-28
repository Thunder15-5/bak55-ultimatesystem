import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Coins, Calendar, Music, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubmitExistingTrackDialogProps {
  mode: 'select-competition' | 'select-track';
  trackId?: string;
  competitionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitExistingTrackDialog({
  mode,
  trackId,
  competitionId,
  open,
  onOpenChange,
  onSuccess
}: SubmitExistingTrackDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(competitionId || '');
  const [selectedTrackId, setSelectedTrackId] = useState(trackId || '');
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    if (open && user) {
      fetchData();
      fetchWallet();
    }
  }, [open, user, mode]);

  const fetchWallet = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();
    
    if (data) setWallet(data);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === 'select-competition') {
        await fetchActiveCompetitions();
      } else {
        await fetchApprovedTracks();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCompetitions = async () => {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Check for existing submissions
      const competitionIds = data.map(c => c.id);
      const { data: existingSubmissions } = await supabase
        .from('submissions')
        .select('competition_id')
        .eq('artist_id', user!.id)
        .eq('track_id', trackId)
        .in('competition_id', competitionIds);

      const submittedCompetitionIds = new Set(existingSubmissions?.map(s => s.competition_id));
      const available = data.filter(c => !submittedCompetitionIds.has(c.id));
      
      setCompetitions(available);
    }
  };

  const fetchApprovedTracks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', user.id)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Check for existing submissions if competition is selected
      if (competitionId) {
        const trackIds = data.map(t => t.id);
        const { data: existingSubmissions } = await supabase
          .from('submissions')
          .select('track_id')
          .eq('competition_id', competitionId)
          .eq('artist_id', user.id)
          .in('track_id', trackIds);

        const submittedTrackIds = new Set(existingSubmissions?.map(s => s.track_id));
        const available = data.filter(t => !submittedTrackIds.has(t.id));
        
        setTracks(available);
      } else {
        setTracks(data);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const finalTrackId = mode === 'select-competition' ? trackId : selectedTrackId;
    const finalCompetitionId = mode === 'select-competition' ? selectedCompetitionId : competitionId;

    if (!finalTrackId || !finalCompetitionId) {
      toast.error("Please select all required options");
      return;
    }

    setSubmitting(true);

    try {
      // Get competition details
      const { data: competition } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', finalCompetitionId)
        .single();

      if (!competition) throw new Error("Competition not found");

      // Check if submission period is open
      const now = new Date();
      const start = new Date(competition.start_date);
      const end = new Date(competition.end_date);
      
      if (now < start || now > end) {
        toast.error("Submission period for this competition is closed");
        return;
      }

      // Handle entry fee
      if (competition.entry_fee > 0) {
        if (!wallet || wallet.balance < competition.entry_fee) {
          toast.error(`Insufficient balance. You need ${competition.entry_fee} BAK to enter this competition.`);
          return;
        }

        // Deduct entry fee
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance - competition.entry_fee })
          .eq('id', wallet.id);

        if (walletError) throw walletError;

        // Record transaction
        await supabase
          .from('transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'spending',
            amount: -competition.entry_fee,
            description: `Entry fee for ${competition.title}`,
            reference_id: finalCompetitionId,
          });
      }

      // Get track details
      const { data: track } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', finalTrackId)
        .single();

      if (!track) throw new Error("Track not found");

      // Create submission
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          competition_id: finalCompetitionId,
          artist_id: user.id,
          track_id: finalTrackId,
          title: track.title,
          description: '',
          audio_url: track.audio_url,
          cover_image: track.cover_image,
          status: 'pending',
          moderation_status: 'pending',
        });

      if (submissionError) {
        if (submissionError.code === '23505') {
          toast.error("This track has already been submitted to this competition");
          return;
        }
        throw submissionError;
      }

      toast.success("Track submitted to competition successfully!");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/competitions/${finalCompetitionId}`);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || "Failed to submit track");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCompetition = competitions.find(c => c.id === selectedCompetitionId);
  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'select-competition' ? 'Submit to Competition' : 'Select Track to Submit'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'select-competition' 
              ? 'Choose a competition to submit your track to' 
              : 'Select one of your approved tracks to submit'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {mode === 'select-competition' ? (
              <>
                <div className="space-y-3">
                  <Label>Available Competitions</Label>
                  {competitions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No active competitions available, or this track is already submitted to all active competitions.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {competitions.map((comp) => (
                        <div
                          key={comp.id}
                          onClick={() => setSelectedCompetitionId(comp.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedCompetitionId === comp.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <h4 className="font-semibold">{comp.title}</h4>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {comp.prize_amount} BAK
                                </div>
                                {comp.entry_fee > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Coins className="w-3 h-3" />
                                    {comp.entry_fee} BAK fee
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Until {new Date(comp.end_date).toLocaleDateString()}
                                </div>
                              </div>
                              {comp.genres && comp.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {comp.genres.map((genre: string) => (
                                    <Badge key={genre} variant="secondary" className="text-xs">
                                      {genre}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label>Your Approved Tracks</Label>
                  {tracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No approved tracks available. Upload and get tracks approved first, or all eligible tracks are already submitted.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {tracks.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => setSelectedTrackId(track.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTrackId === track.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={track.cover_image || "/placeholder.svg"}
                              alt={track.title}
                              className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold">{track.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {track.genre || 'No genre'} • {track.plays || 0} plays
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Summary Card */}
            {((mode === 'select-competition' && selectedCompetition) || 
              (mode === 'select-track' && selectedTrack)) && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <h4 className="font-semibold">Submission Summary</h4>
                <div className="space-y-2 text-sm">
                  {mode === 'select-competition' && selectedCompetition && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Competition:</span>
                        <span className="font-medium">{selectedCompetition.title}</span>
                      </div>
                      {selectedCompetition.entry_fee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <span className="font-medium">{selectedCompetition.entry_fee} BAK</span>
                        </div>
                      )}
                    </>
                  )}
                  {mode === 'select-track' && selectedTrack && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Track:</span>
                      <span className="font-medium">{selectedTrack.title}</span>
                    </div>
                  )}
                  {wallet && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Balance:</span>
                      <span className="font-medium">{wallet.balance.toFixed(2)} BAK</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={submitting || (mode === 'select-competition' ? !selectedCompetitionId : !selectedTrackId)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Submit Track
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
