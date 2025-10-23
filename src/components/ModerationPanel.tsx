import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  type: "track" | "submission";
  artist_username: string;
  artist_email: string;
  moderation_status: string;
  moderation_notes?: string;
  created_at: string;
  audio_url?: string;
  cover_image?: string;
  genre?: string;
}

export function ModerationPanel() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    setLoading(true);

    try {
      // Fetch pending tracks
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          genre,
          audio_url,
          cover_image,
          moderation_status,
          moderation_notes,
          created_at,
          profiles:artist_id (username, email)
        `)
        .in("moderation_status", ["pending", "flagged"]);

      // Fetch pending submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(`
          id,
          title,
          audio_url,
          cover_image,
          moderation_status,
          moderation_notes,
          created_at,
          profiles:artist_id (username, email)
        `)
        .in("moderation_status", ["pending", "flagged"]);

      if (tracksError) throw tracksError;
      if (submissionsError) throw submissionsError;

      const tracksFormatted: ContentItem[] = (tracks || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        type: "track" as const,
        artist_username: t.profiles?.username || "Unknown",
        artist_email: t.profiles?.email || "",
        moderation_status: t.moderation_status,
        moderation_notes: t.moderation_notes,
        created_at: t.created_at,
        audio_url: t.audio_url,
        cover_image: t.cover_image,
        genre: t.genre,
      }));

      const submissionsFormatted: ContentItem[] = (submissions || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        type: "submission" as const,
        artist_username: s.profiles?.username || "Unknown",
        artist_email: s.profiles?.email || "",
        moderation_status: s.moderation_status,
        moderation_notes: s.moderation_notes,
        created_at: s.created_at,
        audio_url: s.audio_url,
        cover_image: s.cover_image,
      }));

      setItems([...tracksFormatted, ...submissionsFormatted]);
    } catch (error: any) {
      toast.error("Failed to load content for moderation");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (
    itemId: string,
    itemType: "track" | "submission",
    action: "approve" | "reject"
  ) => {
    setProcessing(itemId);

    try {
      const table = itemType === "track" ? "tracks" : "submissions";
      const status = action === "approve" ? "approved" : "rejected";

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from(table)
        .update({
          moderation_status: status,
          moderation_notes: notes[itemId] || null,
          moderated_at: new Date().toISOString(),
          moderated_by: userData.user?.id,
        })
        .eq("id", itemId);

      if (error) throw error;

      // Note: Notifications are automatically sent via database triggers

      toast.success(`${itemType} ${action === "approve" ? "approved" : "rejected"}`);
      fetchPendingContent();
    } catch (error: any) {
      toast.error(error.message || "Failed to moderate content");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No content pending moderation</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {item.cover_image && (
                    <img 
                      src={item.cover_image} 
                      alt={item.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      By {item.artist_username} ({item.artist_email})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                      {item.genre && ` • ${item.genre}`}
                    </p>
                  </div>
                </div>
              </div>
              <Badge variant={item.moderation_status === "flagged" ? "destructive" : "secondary"}>
                {item.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Preview */}
            {item.audio_url && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Audio Preview:</p>
                <audio controls className="w-full" preload="metadata">
                  <source src={item.audio_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {item.moderation_notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Previous notes:</p>
                <p className="text-sm">{item.moderation_notes}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor={`notes-${item.id}`}>Moderation Notes (Optional)</Label>
              <Textarea
                id={`notes-${item.id}`}
                placeholder="Add feedback for the artist..."
                value={notes[item.id] || ""}
                onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleModerate(item.id, item.type, "approve")}
                disabled={processing === item.id}
                variant="default"
                size="lg"
                className="flex-1"
              >
                {processing === item.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                onClick={() => handleModerate(item.id, item.type, "reject")}
                disabled={processing === item.id}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                {processing === item.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
