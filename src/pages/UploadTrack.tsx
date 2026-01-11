import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Upload, Music, Sparkles } from "lucide-react";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UploadTrack() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [classifyingGenre, setClassifyingGenre] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    description: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitToCompetition, setSubmitToCompetition] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [canUpload, setCanUpload] = useState(true);
  const [uploadMessage, setUploadMessage] = useState("");
  const [subscription, setSubscription] = useState<any>(null);
  const [uploadMode, setUploadMode] = useState<'new' | 'existing'>('new');
  const [existingTracks, setExistingTracks] = useState<any[]>([]);
  const [selectedExistingTrack, setSelectedExistingTrack] = useState('');

  useEffect(() => {
    fetchActiveCompetitions();
    checkUploadEligibility();
    fetchSubscription();
    fetchExistingTracks();
  }, [user]);

  // Only redirect after userRole has been determined (not during loading)
  useEffect(() => {
    // Wait for auth to fully load before making redirect decisions
    if (userRole === null || userRole === undefined) {
      // Still loading, don't redirect yet
      return;
    }
    
    if (userRole !== 'artist' && userRole !== 'admin') {
      navigate('/streaming');
      toast.error('Only artists can upload tracks. Upgrade to Artist to start sharing your music!');
    }
  }, [userRole, navigate]);

  const fetchActiveCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, entry_fee, end_date')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      setCompetitions(data || []);
      
      // Auto-select competition from query param
      const competitionId = searchParams.get('competition');
      if (competitionId && data?.some(c => c.id === competitionId)) {
        setSubmitToCompetition(true);
        setSelectedCompetition(competitionId);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (data) {
      setSubscription(data);
    }
  };

  const fetchExistingTracks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', user.id)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExistingTracks(data);
    }
  };

  const checkUploadEligibility = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('can_user_upload_track', {
        user_id_param: user.id
      });

      if (error) throw error;

      setCanUpload(data);
      
      if (!data) {
        setUploadMessage("Subscribe to Artist Pro or Premium for unlimited uploads!");
      }
    } catch (error) {
      console.error('Error checking upload eligibility:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate based on mode
    if (uploadMode === 'new' && !audioFile) {
      toast.error("Please select an audio file");
      return;
    }
    if (uploadMode === 'existing' && !selectedExistingTrack) {
      toast.error("Please select a track");
      return;
    }

    setUploading(true);

    try {
      let trackData;

      if (uploadMode === 'existing') {
        // Use existing track
        const { data: existingTrack } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', selectedExistingTrack)
          .single();

        if (!existingTrack) throw new Error("Track not found");
        trackData = existingTrack;
      } else {
        // Upload audio file
        const audioPath = `${user.id}/${Date.now()}-${audioFile!.name}`;
        const { error: audioError } = await supabase.storage
          .from("tracks")
          .upload(audioPath, audioFile!);

        if (audioError) throw audioError;

        const { data: { publicUrl: audioUrl } } = supabase.storage
          .from("tracks")
          .getPublicUrl(audioPath);

        // Upload cover if provided
        let coverUrl = null;
        if (coverFile) {
          const coverPath = `${user.id}/${Date.now()}-${coverFile.name}`;
          const { error: coverError } = await supabase.storage
            .from("covers")
            .upload(coverPath, coverFile);

          if (coverError) throw coverError;

          const { data: { publicUrl } } = supabase.storage
            .from("covers")
            .getPublicUrl(coverPath);
          coverUrl = publicUrl;
        }

        // Create track record with pending moderation status
        const { data: newTrack, error: dbError } = await supabase
          .from("tracks")
          .insert({
            artist_id: user.id,
            title: formData.title,
            genre: formData.genre,
            audio_url: audioUrl,
            cover_image: coverUrl,
            moderation_status: 'pending',
          })
          .select()
          .single();

        if (dbError) throw dbError;
        trackData = newTrack;

        // Send notification email to company
        await supabase.functions.invoke('send-email', {
          body: {
            to: 'info@bak55talent.co.ke',
            subject: 'New Track Upload - Pending Approval',
            html: `
              <h2>New Track Uploaded</h2>
              <p><strong>Artist:</strong> ${user.email}</p>
              <p><strong>Track Title:</strong> ${formData.title}</p>
              <p><strong>Genre:</strong> ${formData.genre || 'Not specified'}</p>
              <p><strong>Status:</strong> Pending Approval</p>
              <p><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
              <p><a href="${window.location.origin}/admin">Review in Admin Panel</a></p>
            `,
            type: 'upload',
          },
        });
      }

      // Handle competition submission
      if (submitToCompetition && selectedCompetition) {
        const competition = competitions.find(c => c.id === selectedCompetition);
        
        // Check entry fee and deduct from wallet
        if (competition?.entry_fee > 0) {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance, id')
            .eq('user_id', user.id)
            .single();

          if (!wallet || wallet.balance < competition.entry_fee) {
            toast.error("Insufficient balance for entry fee");
            return;
          }

          // Deduct entry fee
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance - competition.entry_fee })
            .eq('user_id', user.id);

          // Record transaction
          await supabase
            .from('transactions')
            .insert([{
              wallet_id: wallet.id,
              type: 'spending',
              amount: -competition.entry_fee, // Negative for deduction
              description: `Entry fee for ${competition.title}`,
            }]);
        }

        // Create submission
        const { error: submissionError } = await supabase
          .from('submissions')
          .insert({
            competition_id: selectedCompetition,
            artist_id: user.id,
            track_id: trackData.id,
            title: trackData.title,
            description: formData.description || '',
            audio_url: trackData.audio_url,
            cover_image: trackData.cover_image,
            status: 'pending',
            moderation_status: 'pending',
          });

        if (submissionError) throw submissionError;

        if (uploadMode === 'existing') {
          toast.success("Track submitted to competition successfully!");
        } else {
          toast.success("Track uploaded and submitted to competition! Pending admin approval.");
        }
      } else {
        if (uploadMode === 'existing') {
          toast.success("Using existing track!");
        } else {
          toast.success("Track uploaded successfully! Pending admin approval.");
        }
      }

      // Refresh upload eligibility
      if (uploadMode === 'new') {
        await checkUploadEligibility();
      }

      // Reset form
      setFormData({ title: "", genre: "", description: "" });
      setAudioFile(null);
      setCoverFile(null);
      setSubmitToCompetition(false);
      setSelectedCompetition("");
      setSelectedExistingTrack("");
      setUploadMode('new');
    } catch (error: any) {
      toast.error(error.message || "Failed to upload track");
    } finally {
      setUploading(false);
    }
  };

  const handleAutoClassifyGenre = async () => {
    if (!formData.title) {
      toast.error("Please enter a track title first");
      return;
    }

    setClassifyingGenre(true);

    try {
      const { data, error } = await supabase.functions.invoke('classify-genre', {
        body: {
          track_id: 'temp',
          title: formData.title,
        }
      });

      if (error) throw error;

      setFormData({ ...formData, genre: data.genre });
      toast.success(`Genre classified as: ${data.genre}`, {
        description: `Confidence: ${(data.confidence * 100).toFixed(0)}%`,
      });
    } catch (error: any) {
      console.error('Genre classification error:', error);
      toast.error(error.message || 'Failed to classify genre');
    } finally {
      setClassifyingGenre(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Upload Track</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Share Your <span className="text-gradient">Music</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your track and reach thousands of listeners across the platform
          </p>
          
          {subscription && (
            <div className="flex justify-center">
              <SubscriptionBadge planName={subscription.subscription_plans.name} />
            </div>
          )}
          
          {!canUpload && (
            <div className="max-w-4xl mx-auto mt-6">
              <UpgradePrompt />
            </div>
          )}
        </div>
      </section>
      
      <div className="container mx-auto px-4 pb-12">
        {!canUpload ? (
          <Card className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Upload Limit Reached</CardTitle>
              <CardDescription>
                {uploadMessage || "Please wait for admin approval before uploading more tracks."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/catalog')} variant="outline" className="w-full">
                View Music Catalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Track Details</CardTitle>
              <CardDescription>
                Fill in the information about your music
              </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'new' | 'existing')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new">Upload New Track</TabsTrigger>
                  <TabsTrigger value="existing">Use Existing Track</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Track Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required={uploadMode === 'new'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="genre">Genre</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoClassifyGenre}
                        disabled={classifyingGenre || !formData.title}
                      >
                        {classifyingGenre ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Classifying...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-3 w-3" />
                            AI Classify
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      id="genre"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      placeholder="e.g., Hip Hop, Afrobeat, Pop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio">Audio File * (MP3, WAV, M4A, FLAC)</Label>
                    <Input
                      id="audio"
                      type="file"
                      accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,audio/mpeg,audio/wav,audio/x-m4a,audio/flac"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      required={uploadMode === 'new'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only audio files are accepted (no videos)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image</Label>
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="existing" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="existingTrack">Select Track *</Label>
                    {existingTracks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        You don't have any approved tracks yet. Upload a track first!
                      </p>
                    ) : (
                      <Select value={selectedExistingTrack} onValueChange={setSelectedExistingTrack}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a track..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingTracks.map((track) => (
                            <SelectItem key={track.id} value={track.id}>
                              {track.title} {track.genre ? `(${track.genre})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {selectedExistingTrack && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      {(() => {
                        const track = existingTracks.find(t => t.id === selectedExistingTrack);
                        return track ? (
                          <div className="flex items-center gap-4">
                            <img
                              src={track.cover_image || "/placeholder.svg"}
                              alt={track.title}
                              className="w-20 h-20 rounded object-cover"
                            />
                            <div>
                              <h4 className="font-semibold">{track.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {track.genre || 'No genre'} • {track.plays || 0} plays
                              </p>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your track..."
                  rows={3}
                />
              </div>

              {competitions.length > 0 && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="submitToCompetition"
                      checked={submitToCompetition}
                      onChange={(e) => setSubmitToCompetition(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="submitToCompetition" className="cursor-pointer">
                      Submit to Competition
                    </Label>
                  </div>

                  {submitToCompetition && (
                    <div className="space-y-2">
                      <Label htmlFor="competition">Select Competition</Label>
                      <select
                        id="competition"
                        value={selectedCompetition}
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        required={submitToCompetition}
                      >
                        <option value="">Choose a competition...</option>
                        {competitions.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.title} {comp.entry_fee > 0 && `(${comp.entry_fee} BAK entry fee)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Track
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
