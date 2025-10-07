import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Music, Play, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Tracks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const { data: tracks } = useQuery({
    queryKey: ["user-tracks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile || !title) {
        throw new Error("Please fill all fields");
      }

      const fileExt = audioFile.name.split(".").pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("tracks")
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("tracks")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("tracks").insert({
        artist_id: user!.id,
        title,
        genre: genre || null,
        audio_url: publicUrl,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-tracks"] });
      toast({ title: "Track uploaded successfully!" });
      setTitle("");
      setGenre("");
      setAudioFile(null);
      setUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    uploadMutation.mutate();
  };

  const togglePlay = (trackId: string) => {
    setCurrentlyPlaying(currentlyPlaying === trackId ? null : trackId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Tracks</h1>
            <p className="text-muted-foreground">Upload and manage your music</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Track
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Track</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="title">Track Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter track title"
                  />
                </div>

                <div>
                  <Label htmlFor="genre">Genre (Optional)</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g., Hip Hop, Afrobeat"
                  />
                </div>

                <div>
                  <Label htmlFor="audio">Audio File (MP3/WAV)</Label>
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/mp3,audio/wav,audio/mpeg"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Track"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks?.map((track) => (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  {track.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {track.genre && (
                  <p className="text-sm text-muted-foreground">Genre: {track.genre}</p>
                )}
                <p className="text-sm text-muted-foreground">Plays: {track.plays || 0}</p>
                
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => togglePlay(track.id)}
                >
                  {currentlyPlaying === track.id ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </Button>

                {currentlyPlaying === track.id && (
                  <audio
                    src={track.audio_url}
                    controls
                    autoPlay
                    className="w-full mt-2"
                    onEnded={() => setCurrentlyPlaying(null)}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {tracks?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first track to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracks;
