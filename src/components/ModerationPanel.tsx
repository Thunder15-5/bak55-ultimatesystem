import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  type: "track" | "submission";
  artist_username: string;
  moderation_status: string;
  moderation_notes?: string;
  created_at: string;
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
          moderation_status,
          moderation_notes,
          created_at,
          profiles:artist_id (username)
        `)
        .in("moderation_status", ["pending", "flagged"]);

      // Fetch pending submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(`
          id,
          title,
          moderation_status,
          moderation_notes,
          created_at,
          profiles:artist_id (username)
        `)
        .in("moderation_status", ["pending", "flagged"]);

      if (tracksError) throw tracksError;
      if (submissionsError) throw submissionsError;

      const tracksFormatted: ContentItem[] = (tracks || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        type: "track" as const,
        artist_username: t.profiles?.username || "Unknown",
        moderation_status: t.moderation_status,
        moderation_notes: t.moderation_notes,
        created_at: t.created_at,
      }));

      const submissionsFormatted: ContentItem[] = (submissions || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        type: "submission" as const,
        artist_username: s.profiles?.username || "Unknown",
        moderation_status: s.moderation_status,
        moderation_notes: s.moderation_notes,
        created_at: s.created_at,
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

      // Get artist ID and email
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const { data: artistData } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("username", item.artist_username)
          .single();

        if (artistData) {
          // Send notification to artist
          await supabase.from("notifications").insert({
            user_id: artistData.id,
            type: "moderation",
            title: `Content ${action === "approve" ? "Approved" : "Rejected"}`,
            message: `Your ${itemType} "${item.title}" has been ${
              action === "approve" ? "approved" : "rejected"
            }${notes[itemId] ? `: ${notes[itemId]}` : ""}`,
            link: itemType === "track" ? `/track/${itemId}` : `/competition/${itemId}`,
          });

          // Send email notification to artist
          await supabase.functions.invoke('send-email', {
            body: {
              to: artistData.email,
              subject: `Your Track "${item.title}" has been ${action === "approve" ? "Approved" : "Rejected"}`,
              html: `
                <h2>Track ${action === "approve" ? "Approval" : "Rejection"} Notification</h2>
                <p>Hello ${item.artist_username},</p>
                <p>Your ${itemType} "<strong>${item.title}</strong>" has been <strong>${
                  action === "approve" ? "approved" : "rejected"
                }</strong>.</p>
                ${notes[itemId] ? `<p><strong>Notes:</strong> ${notes[itemId]}</p>` : ""}
                ${action === "approve" ? "<p>Your track is now live on the platform! Fans can now discover and listen to your music.</p>" : "<p>Please review the feedback and feel free to upload a revised version.</p>"}
                <p>Best regards,<br>BAK55 Team</p>
              `,
              type: 'moderation',
            },
          });
        }
      }

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
              <div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  By {item.artist_username} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={item.moderation_status === "flagged" ? "destructive" : "secondary"}>
                {item.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.moderation_notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Previous notes:</p>
                <p className="text-sm">{item.moderation_notes}</p>
              </div>
            )}
            <Textarea
              placeholder="Add moderation notes (optional)..."
              value={notes[item.id] || ""}
              onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleModerate(item.id, item.type, "approve")}
                disabled={processing === item.id}
                variant="default"
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
