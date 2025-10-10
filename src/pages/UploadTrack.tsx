import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Upload, Music } from "lucide-react";

export default function UploadTrack() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    description: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

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
      const { error: dbError } = await supabase
        .from("tracks")
        .insert({
          artist_id: user.id,
          title: formData.title,
          genre: formData.genre,
          audio_url: audioUrl,
          cover_image: coverUrl,
        });

      if (dbError) throw dbError;

      toast.success("Track uploaded successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload track");
    } finally {
      setUploading(false);
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
                <Label htmlFor="genre">Genre</Label>
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
