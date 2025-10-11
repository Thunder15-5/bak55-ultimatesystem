import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function UploadTrack() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchActiveCompetitions();
  }, []);

  const fetchActiveCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, entry_fee, end_date')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !audioFile) return;

    setUploading(true);

    try {
      // Upload audio file
      const audioPath = `${user.id}/${Date.now()}-${audioFile.name}`;
      const { error: audioError } = await supabase.storage
        .from("tracks")
        .upload(audioPath, audioFile);

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

      // Create track record
      const { data: trackData, error: dbError } = await supabase
        .from("tracks")
        .insert({
          artist_id: user.id,
          title: formData.title,
          genre: formData.genre,
          audio_url: audioUrl,
          cover_image: coverUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

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
              type: 'purchase',
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
            title: formData.title,
            description: formData.description,
            audio_url: audioUrl,
            cover_image: coverUrl,
            status: 'pending',
          });

        if (submissionError) throw submissionError;

        toast.success("Track uploaded and submitted to competition!");
      } else {
        toast.success("Track uploaded successfully!");
      }

      navigate("/catalog");
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
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-6 w-6" />
              Upload New Track
            </CardTitle>
            <CardDescription>
              Share your music with the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
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
                <Label htmlFor="audio">Audio File *</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  required
                />
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

              <Button type="submit" className="w-full" disabled={uploading}>
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
      </div>
    </div>
  );
}
