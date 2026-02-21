import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Search, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Track {
  id: string;
  title: string;
  genre: string;
  cover_image: string;
  artist_username: string;
}

interface AddTracksDialogProps {
  playlistId: string;
  existingTrackIds: string[];
  onTracksAdded: () => void;
}

export function AddTracksDialog({ playlistId, existingTrackIds, onTracksAdded }: AddTracksDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableTracks();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredTracks(
        tracks.filter(
          (track) =>
            track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.artist_username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredTracks(tracks);
    }
  }, [searchQuery, tracks]);

  const fetchAvailableTracks = async () => {
    setLoading(true);
    try {
      const { data: tracksData, error } = await supabase
        .from("tracks")
        .select("id, title, genre, cover_image, artist_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get artist usernames
      const artistIds = Array.from(new Set(tracksData?.map((t) => t.artist_id).filter(Boolean)));
      const { data: artists } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", artistIds.length ? artistIds : ["00000000-0000-0000-0000-000000000000"]);

      const artistMap = new Map((artists || []).map((a: any) => [a.id, a.username]));

      const enrichedTracks = (tracksData || [])
        .filter((track) => !existingTrackIds.includes(track.id))
        .map((track) => ({
          id: track.id,
          title: track.title,
          genre: track.genre || "Unknown",
          cover_image: track.cover_image || "",
          artist_username: artistMap.get(track.artist_id) || "Unknown Artist",
        }));

      setTracks(enrichedTracks);
      setFilteredTracks(enrichedTracks);
    } catch (error: any) {
      toast.error("Failed to load tracks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrack = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleAddTracks = async () => {
    if (selectedTracks.size === 0) {
      toast.error("Please select at least one track");
      return;
    }

    setAdding(true);
    try {
      const trackEntries = Array.from(selectedTracks).map((trackId, index) => ({
        playlist_id: playlistId,
        track_id: trackId,
        position: existingTrackIds.length + index,
      }));

      const { error } = await supabase.from("playlist_tracks").insert(trackEntries);

      if (error) throw error;

      toast.success(`Added ${selectedTracks.size} track(s) to playlist`);
      setSelectedTracks(new Set());
      setOpen(false);
      onTracksAdded();
    } catch (error: any) {
      toast.error("Failed to add tracks");
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Tracks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tracks to Playlist</DialogTitle>
          <DialogDescription>Select tracks to add to this playlist</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Track List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "No tracks found" : "No tracks available to add"}
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer"
                    onClick={() => toggleTrack(track.id)}
                  >
                    <Checkbox
                      checked={selectedTracks.has(track.id)}
                      onCheckedChange={() => toggleTrack(track.id)}
                    />
                    {track.cover_image && (
                      <img
                        src={track.cover_image}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist_username} • {track.genre}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedTracks.size} track(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTracks} disabled={adding || selectedTracks.size === 0}>
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Selected"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
