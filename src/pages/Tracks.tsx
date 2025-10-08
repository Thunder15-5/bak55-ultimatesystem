import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Tracks() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, [user]);

  const fetchTracks = async () => {
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', user!.id)
      .order('created_at', { ascending: false });
    setTracks(data || []);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('audio-file') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      toast.error('Please select an audio file');
      return;
    }

    setUploading(true);

    // Upload to storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tracks')
      .upload(fileName, file);

    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tracks')
      .getPublicUrl(fileName);

    // Save metadata to database
    const { error: dbError } = await supabase.from('tracks').insert({
      artist_id: user!.id,
      title,
      genre,
      audio_url: publicUrl,
      duration: 0, // Would need to calculate from audio file
    });

    if (dbError) {
      toast.error(dbError.message);
    } else {
      toast.success('Track uploaded successfully!');
      setTitle('');
      setGenre('');
      fileInput.value = '';
      fetchTracks();
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-gradient mb-8">My Tracks</h1>
        
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Upload New Track</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input
              placeholder="Track Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              placeholder="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
            />
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              required
            />
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Track'}
            </Button>
          </form>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <Card key={track.id} className="p-4">
              <h3 className="font-bold text-lg text-foreground">{track.title}</h3>
              <p className="text-muted-foreground">{track.genre}</p>
              <p className="text-sm text-muted-foreground mt-2">Plays: {track.plays || 0}</p>
              <audio controls className="w-full mt-4">
                <source src={track.audio_url} type="audio/mpeg" />
              </audio>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
