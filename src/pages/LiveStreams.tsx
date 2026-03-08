import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Calendar, Users, Play, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { StreamViewer } from "@/components/StreamViewer";

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_start: string;
  viewer_count: number;
  artist_id: string;
  artist_profiles: {
    stage_name: string;
  };
}

export default function LiveStreams() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_start: ""
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .select(`
          *,
          artist_profiles(stage_name)
        `)
        .in("status", ["scheduled", "live"])
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
    }
  };

  const createStream = async () => {
    if (!formData.title || !formData.scheduled_start) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("live_streams")
        .insert({
          artist_id: user?.id,
          title: formData.title,
          description: formData.description,
          scheduled_start: formData.scheduled_start,
          status: "scheduled"
        });

      if (error) throw error;

      toast.success("Live stream scheduled!");
      setDialogOpen(false);
      setFormData({ title: "", description: "", scheduled_start: "" });
      fetchStreams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "destructive";
      case "scheduled": return "default";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Live Streams</h1>
            <p className="text-muted-foreground">Watch live performances and connect with artists</p>
          </div>
          {userRole === "artist" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Radio className="h-5 w-5 mr-2" />
                  Schedule Stream
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule a Live Stream</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Live Performance Title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell viewers what to expect..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Scheduled Start</label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                    />
                  </div>
                  <Button onClick={createStream} className="w-full">Schedule Stream</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Radio className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No live streams scheduled yet</p>
            </div>
          ) : (
            streams.map((stream) => (
              <Card key={stream.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getStatusColor(stream.status)}>
                      {stream.status === "live" && <Play className="h-3 w-3 mr-1 animate-pulse" />}
                      {stream.status.toUpperCase()}
                    </Badge>
                    {stream.status === "live" && (
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        {stream.viewer_count}
                      </div>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{stream.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">by {stream.artist_profiles.stage_name}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {stream.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    {new Date(stream.scheduled_start).toLocaleString()}
                  </div>
                  <Button 
                    className="w-full" 
                    variant={stream.status === "live" ? "default" : "outline"}
                    disabled={stream.status !== "live"}
                  >
                    {stream.status === "live" ? "Watch Live" : "Coming Soon"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
