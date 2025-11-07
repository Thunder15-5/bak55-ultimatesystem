import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Send, Check, X } from "lucide-react";
import { toast } from "sonner";

interface CollaborationRequest {
  id: string;
  from_artist_id: string;
  to_artist_id: string;
  message: string;
  status: string;
  created_at: string;
  from_artist: {
    stage_name: string;
    user_id: string;
  };
  to_artist: {
    stage_name: string;
    user_id: string;
  };
}

export function ArtistCollaboration() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchArtists();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("collaboration_requests")
        .select(`
          *,
          from_artist:artist_profiles!collaboration_requests_from_artist_id_fkey(stage_name, user_id),
          to_artist:artist_profiles!collaboration_requests_to_artist_id_fkey(stage_name, user_id)
        `)
        .or(`from_artist_id.eq.${user?.id},to_artist_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const { data } = await supabase
        .from("artist_profiles")
        .select("user_id, stage_name")
        .neq("user_id", user?.id)
        .limit(50);

      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
  };

  const sendRequest = async () => {
    if (!selectedArtist || !message) {
      toast.error("Please select an artist and add a message");
      return;
    }

    try {
      const { error } = await supabase
        .from("collaboration_requests")
        .insert({
          from_artist_id: user?.id,
          to_artist_id: selectedArtist,
          message
        });

      if (error) throw error;

      toast.success("Collaboration request sent!");
      setDialogOpen(false);
      setMessage("");
      setSelectedArtist("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateRequest = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("collaboration_requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Artist Collaborations
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Collaboration Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Artist</label>
                    <select
                      value={selectedArtist}
                      onChange={(e) => setSelectedArtist(e.target.value)}
                      className="w-full p-2 rounded border bg-background"
                    >
                      <option value="">Choose an artist...</option>
                      {artists.map((artist) => (
                        <option key={artist.user_id} value={artist.user_id}>
                          {artist.stage_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your collaboration idea..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={sendRequest} className="w-full">Send Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No collaboration requests yet</p>
            ) : (
              requests.map((request) => {
                const isReceived = request.to_artist_id === user?.id;
                const otherArtist = isReceived ? request.from_artist : request.to_artist;
                
                return (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={isReceived ? "default" : "secondary"}>
                              {isReceived ? "Received" : "Sent"}
                            </Badge>
                            <Badge variant={
                              request.status === "accepted" ? "default" :
                              request.status === "rejected" ? "destructive" :
                              "outline"
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="font-medium">{otherArtist.stage_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {isReceived && request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateRequest(request.id, "accepted")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateRequest(request.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
