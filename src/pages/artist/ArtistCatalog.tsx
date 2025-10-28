import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Upload, Play, Heart, MessageCircle, MoreVertical, Trash2, BarChart3, Music } from "lucide-react";
import { Loader2 } from "lucide-react";
import { SubmitExistingTrackDialog } from "@/components/SubmitExistingTrackDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ArtistCatalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalPlays: 0,
    totalLikes: 0,
  });
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [tracks]);

  const fetchTracks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("tracks")
      .select(`
        *,
        track_likes (count),
        comments (count)
      `)
      .eq("artist_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTracks(data);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const totalPlays = tracks.reduce((sum, track) => sum + (track.plays || 0), 0);
    const totalLikes = tracks.reduce((sum, track) => sum + (track.track_likes?.[0]?.count || 0), 0);
    setStats({
      totalTracks: tracks.length,
      totalPlays,
      totalLikes,
    });
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return;

    const { error } = await supabase
      .from("tracks")
      .delete()
      .eq("id", trackId);

    if (error) {
      toast.error("Failed to delete track");
    } else {
      toast.success("Track deleted successfully");
      fetchTracks();
    }
  };

  const handleSubmitToCompetition = (trackId: string) => {
    setSelectedTrackId(trackId);
    setSubmitDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filteredTracks = statusFilter === "all"
    ? tracks
    : tracks.filter((track) => track.moderation_status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Music Catalog</h1>
            <p className="text-muted-foreground">
              Manage your uploaded tracks
            </p>
          </div>
          <Button onClick={() => navigate("/artist/upload")} size="lg">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Track
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Tracks</h3>
            <p className="text-3xl font-bold">{stats.totalTracks}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Plays</h3>
            <p className="text-3xl font-bold">{stats.totalPlays}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Likes</h3>
            <p className="text-3xl font-bold">{stats.totalLikes}</p>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tracks Table */}
        {filteredTracks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">
              You haven't uploaded any tracks yet.
            </p>
            <Button onClick={() => navigate("/artist/upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Track
            </Button>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Plays</TableHead>
                  <TableHead className="text-center">Likes</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell className="min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <img
                        src={track.cover_image || "/placeholder.svg"}
                        alt={track.title}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                      />
                        <div>
                          <p className="font-medium">{track.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{track.genre || "—"}</TableCell>
                    <TableCell>{getStatusBadge(track.moderation_status)}</TableCell>
                    <TableCell className="text-center">{track.plays || 0}</TableCell>
                    <TableCell className="text-center">
                      {track.track_likes?.[0]?.count || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {track.comments?.[0]?.count || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(track.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/artist/track/${track.id}`)}
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          {track.moderation_status === 'approved' && (
                            <DropdownMenuItem
                              onClick={() => handleSubmitToCompetition(track.id)}
                            >
                              <Music className="w-4 h-4 mr-2" />
                              Submit to Competition
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(track.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      <Footer />

      <SubmitExistingTrackDialog
        mode="select-competition"
        trackId={selectedTrackId || undefined}
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onSuccess={fetchTracks}
      />
    </div>
  );
}
