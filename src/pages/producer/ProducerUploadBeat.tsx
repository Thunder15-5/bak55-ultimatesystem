import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Upload, Music, Sparkles, DollarSign, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GENRES = [
  'Afrobeats', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Amapiano', 
  'Gospel', 'Pop', 'Gengetone', 'Drill', 'Afro-Soul', 'Bongo Flava'
];

const MOODS = [
  'Energetic', 'Chill', 'Dark', 'Uplifting', 'Aggressive', 
  'Romantic', 'Sad', 'Party', 'Motivational'
];

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function ProducerUploadBeat() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    description: "",
    bpm: "",
    key: "",
    mood: [] as string[],
    tags: "",
    priceLeaseBAK: "50",
    pricePremiumBAK: "150",
    priceExclusiveBAK: "500",
    priceLeaseKES: "1000",
    pricePremiumKES: "3000",
    priceExclusiveKES: "10000",
    isFree: false,
    maxLeases: "100",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  useEffect(() => {
    if (userRole !== null && userRole !== 'producer' && userRole !== 'admin') {
      navigate('/streaming');
      toast.error('Only producers can upload beats.');
    }
  }, [userRole, navigate]);

  const handleMoodToggle = (mood: string) => {
    setFormData(prev => ({
      ...prev,
      mood: prev.mood.includes(mood) 
        ? prev.mood.filter(m => m !== mood)
        : [...prev.mood, mood]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a beat title");
      return;
    }

    setUploading(true);

    try {
      // Upload audio file
      const audioExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
      const audioPath = `${user.id}/beats/${Date.now()}_${formData.title.replace(/[^a-zA-Z0-9]/g, '_')}.${audioExt}`;
      
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
        const coverPath = `${user.id}/covers/${Date.now()}_cover.${coverFile.name.split('.').pop()}`;
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile);

        if (!coverError) {
          const { data: { publicUrl } } = supabase.storage
            .from("covers")
            .getPublicUrl(coverPath);
          coverUrl = publicUrl;
        }
      }

      // Upload preview if provided
      let previewUrl = null;
      if (previewFile) {
        const previewPath = `${user.id}/previews/${Date.now()}_preview.${previewFile.name.split('.').pop()}`;
        const { error: previewError } = await supabase.storage
          .from("tracks")
          .upload(previewPath, previewFile);

        if (!previewError) {
          const { data: { publicUrl } } = supabase.storage
            .from("tracks")
            .getPublicUrl(previewPath);
          previewUrl = publicUrl;
        }
      }

      // Create beat record
      const { error: dbError } = await supabase
        .from("beats")
        .insert({
          producer_id: user.id,
          title: formData.title,
          description: formData.description || null,
          genre: formData.genre || null,
          bpm: formData.bpm ? parseInt(formData.bpm) : null,
          key: formData.key || null,
          mood: formData.mood.length > 0 ? formData.mood : null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
          audio_url: audioUrl,
          cover_image: coverUrl,
          preview_url: previewUrl || audioUrl,
          price_lease_bak: formData.isFree ? 0 : parseInt(formData.priceLeaseBAK),
          price_premium_bak: formData.isFree ? 0 : parseInt(formData.pricePremiumBAK),
          price_exclusive_bak: formData.isFree ? 0 : parseInt(formData.priceExclusiveBAK),
          price_lease_kes: formData.isFree ? 0 : parseInt(formData.priceLeaseKES),
          price_premium_kes: formData.isFree ? 0 : parseInt(formData.pricePremiumKES),
          price_exclusive_kes: formData.isFree ? 0 : parseInt(formData.priceExclusiveKES),
          is_free: formData.isFree,
          max_leases: formData.isFree ? null : parseInt(formData.maxLeases),
          status: 'active',
          moderation_status: 'pending',
        });

      if (dbError) throw dbError;

      // Notify admin
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'info@bak55talent.co.ke',
          subject: 'New Beat Upload - Pending Approval',
          template: 'beat_upload_admin',
          data: {
            producer_name: user.user_metadata?.username || user.email,
            producer_email: user.email,
            beat_title: formData.title,
            genre: formData.genre || 'Not specified',
            bpm: formData.bpm || 'Not specified',
          },
        },
      }).catch(() => {}); // Don't fail if email fails

      toast.success("Beat uploaded successfully! Pending admin approval.");
      navigate('/producer/catalog');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload beat");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Upload Beat</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            Upload Your <span className="text-gradient">Beat</span>
          </h1>
          <p className="text-muted-foreground">
            Share your beats with artists and start earning
          </p>
        </div>

        <Card className="max-w-3xl mx-auto border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Beat Details
            </CardTitle>
            <CardDescription>
              Fill in the information about your beat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Beat Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="My Awesome Beat"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={formData.genre} onValueChange={(v) => setFormData({ ...formData, genre: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={formData.bpm}
                    onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                    placeholder="120"
                    min="60"
                    max="200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Select value={formData.key} onValueChange={(v) => setFormData({ ...formData, key: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {KEYS.map((key) => (
                        <SelectItem key={key} value={key}>{key} Major</SelectItem>
                      ))}
                      {KEYS.map((key) => (
                        <SelectItem key={`${key}m`} value={`${key}m`}>{key} Minor</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="dark, trap, 808"
                  />
                </div>
              </div>

              {/* Mood Selection */}
              <div className="space-y-2">
                <Label>Mood</Label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => (
                    <Button
                      key={mood}
                      type="button"
                      variant={formData.mood.includes(mood) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMoodToggle(mood)}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your beat..."
                  rows={3}
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audio">Audio File * (MP3, WAV)</Label>
                  <Input
                    id="audio"
                    type="file"
                    accept=".mp3,.wav,.m4a,.flac,audio/*"
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
              </div>

              {/* Pricing */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Pricing</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(c) => setFormData({ ...formData, isFree: c as boolean })}
                  />
                  <Label htmlFor="isFree">Offer this beat for free</Label>
                </div>

                {!formData.isFree && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lease Price (BAK)</Label>
                        <Input
                          type="number"
                          value={formData.priceLeaseBAK}
                          onChange={(e) => setFormData({ ...formData, priceLeaseBAK: e.target.value })}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Premium Price (BAK)</Label>
                        <Input
                          type="number"
                          value={formData.pricePremiumBAK}
                          onChange={(e) => setFormData({ ...formData, pricePremiumBAK: e.target.value })}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Exclusive Price (BAK)</Label>
                        <Input
                          type="number"
                          value={formData.priceExclusiveBAK}
                          onChange={(e) => setFormData({ ...formData, priceExclusiveBAK: e.target.value })}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Leases (leave blank for unlimited)</Label>
                      <Input
                        type="number"
                        value={formData.maxLeases}
                        onChange={(e) => setFormData({ ...formData, maxLeases: e.target.value })}
                        min="1"
                        placeholder="100"
                      />
                    </div>
                  </>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your beat will be reviewed by our team before it goes live. This usually takes less than 24 hours.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Beat
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
