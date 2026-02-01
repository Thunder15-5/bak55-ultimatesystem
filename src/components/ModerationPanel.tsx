import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2, Filter, CheckSquare, Music } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trackKeys } from "@/hooks/useTracks";

// Centralized query key for moderation list
const MODERATION_KEY = ['moderation', 'pending'] as const;

interface ContentItem {
  id: string;
  title: string;
  type: "track" | "submission";
  artist_id: string;
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
  const queryClient = useQueryClient();
  const [processingAction, setProcessingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch pending content using React Query
  const { data: items = [], isLoading: loading, refetch } = useQuery({
    queryKey: MODERATION_KEY,
    queryFn: async () => {
      // Fetch pending tracks
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          genre,
          artist_id,
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
          artist_id,
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
        artist_id: t.artist_id,
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
        artist_id: s.artist_id,
        artist_username: s.profiles?.username || "Unknown",
        artist_email: s.profiles?.email || "",
        moderation_status: s.moderation_status,
        moderation_notes: s.moderation_notes,
        created_at: s.created_at,
        audio_url: s.audio_url,
        cover_image: s.cover_image,
      }));

      return [...tracksFormatted, ...submissionsFormatted];
    },
  });

  // Apply filters
  const filteredItems = items.filter(item => {
    // Type filter
    if (filterType !== "all" && item.type !== filterType) return false;
    
    // Genre filter
    if (filterGenre !== "all" && item.genre !== filterGenre) return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!item.title.toLowerCase().includes(term) &&
          !item.artist_username.toLowerCase().includes(term) &&
          !item.artist_email.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    return true;
  });

  // Helper: Optimistically remove item from cache
  const removeItemFromCache = (itemId: string, itemType: "track" | "submission") => {
    queryClient.setQueryData<ContentItem[]>(MODERATION_KEY, (old) => 
      old?.filter(i => !(i.id === itemId && i.type === itemType)) ?? []
    );
  };

  // Helper: Optimistically remove multiple items from cache
  const removeItemsFromCache = (itemIds: Set<string>) => {
    queryClient.setQueryData<ContentItem[]>(MODERATION_KEY, (old) => 
      old?.filter(i => !itemIds.has(i.id)) ?? []
    );
  };

  const handleModerate = async (
    itemId: string,
    itemType: "track" | "submission",
    action: "approve" | "reject"
  ) => {
    const item = items.find(i => i.id === itemId && i.type === itemType);
    if (!item) {
      toast.error("Item not found in the current list");
      return;
    }

    setProcessingAction({ id: itemId, action });

    try {
      const table = itemType === "track" ? "tracks" : "submissions";
      const status = action === "approve" ? "approved" : "rejected";
      const currentStatus = item.moderation_status;

      const { data: userData } = await supabase.auth.getUser();

      // Concurrency-safe update: only update if status hasn't changed
      const { error, count } = await supabase
        .from(table)
        .update({
          moderation_status: status,
          moderation_notes: notes[itemId] || null,
          moderated_at: new Date().toISOString(),
          moderated_by: userData.user?.id,
        })
        .eq("id", itemId)
        .eq("moderation_status", currentStatus); // Only update if still in expected status

      if (error) throw error;

      // Remove item from cache immediately (optimistic removal)
      // This works whether we updated it or someone else did
      removeItemFromCache(itemId, itemType);

      // Check if the update actually affected a row
      if (count === 0) {
        // Item was already processed by another admin
        toast.info("Already processed by another moderator");
      } else {
        toast.success(`${itemType} ${action === "approve" ? "approved" : "rejected"} successfully!`);
        
        // Log activity (non-blocking - don't fail the main action)
        try {
          await supabase.from('admin_activity_log').insert({
            user_id: userData.user?.id,
            event_type: `${itemType}_${action === 'approve' ? 'approved' : 'rejected'}`,
            event_category: 'content',
            description: `${action === 'approve' ? 'Approved' : 'Rejected'} ${itemType}: "${item.title}" by ${item.artist_username}`,
            metadata: { 
              item_id: itemId, 
              item_type: itemType,
              artist_id: item.artist_id,
              notes: notes[itemId] || null 
            }
          });
        } catch (logError) {
          console.warn('Failed to log activity:', logError);
        }

        // Send notification to the artist (non-blocking - don't fail the main action)
        if (item.artist_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: item.artist_id,
              type: action === 'approve' ? 'track_approved' : 'track_rejected',
              title: action === 'approve' 
                ? `Your ${itemType} "${item.title}" has been approved! 🎉` 
                : `Your ${itemType} "${item.title}" was not approved`,
              message: action === 'approve'
                ? `Your ${itemType} is now live and visible to all listeners on BAK55 Talent.`
                : `Reason: ${notes[itemId] || 'Please review our content guidelines and try again.'}`,
              link: action === 'approve' ? `/track/${itemId}` : '/upload',
              category: 'moderation',
            });
          } catch (notifyError) {
            console.warn('Failed to send notification:', notifyError);
          }
        }
      }
      
      // Clear notes for this item
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[itemId];
        return newNotes;
      });
      
      // Clear from selection
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      // Invalidate related queries and refetch to sync with server
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trackKeys.all, refetchType: 'active' }),
        queryClient.refetchQueries({ queryKey: MODERATION_KEY }),
      ]);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to moderate content");
      // Refetch to restore correct state on error
      await refetch();
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkModerate = async (action: "approve" | "reject") => {
    if (selectedItems.size === 0) {
      toast.error("No items selected");
      return;
    }

    setBulkProcessing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const status = action === "approve" ? "approved" : "rejected";
      
      const itemsToProcess = items.filter(item => selectedItems.has(item.id));

      // Group by type
      const trackIds = itemsToProcess.filter(i => i.type === "track").map(i => i.id);
      const submissionIds = itemsToProcess.filter(i => i.type === "submission").map(i => i.id);

      // Optimistically remove all selected items from cache immediately
      removeItemsFromCache(selectedItems);

      // Update tracks (only those still pending/flagged)
      if (trackIds.length > 0) {
        const { error: tracksError } = await supabase
          .from("tracks")
          .update({
            moderation_status: status,
            moderated_at: new Date().toISOString(),
            moderated_by: userData.user?.id,
          })
          .in("id", trackIds)
          .in("moderation_status", ["pending", "flagged"]); // Only update pending/flagged

        if (tracksError) throw tracksError;
      }

      // Update submissions (only those still pending/flagged)
      if (submissionIds.length > 0) {
        const { error: submissionsError } = await supabase
          .from("submissions")
          .update({
            moderation_status: status,
            moderated_at: new Date().toISOString(),
            moderated_by: userData.user?.id,
          })
          .in("id", submissionIds)
          .in("moderation_status", ["pending", "flagged"]); // Only update pending/flagged

        if (submissionsError) throw submissionsError;
      }

      toast.success(`${selectedItems.size} items ${action === "approve" ? "approved" : "rejected"}`);
      
      // Log bulk activity (non-blocking - don't fail the main action)
      try {
        await supabase.from('admin_activity_log').insert({
          user_id: userData.user?.id,
          event_type: `bulk_moderation_${action === 'approve' ? 'approved' : 'rejected'}`,
          event_category: 'content',
          description: `Bulk ${action}: ${selectedItems.size} items (${trackIds.length} tracks, ${submissionIds.length} submissions)`,
          metadata: { 
            count: selectedItems.size,
            track_count: trackIds.length,
            submission_count: submissionIds.length,
            action: action
          }
        });
      } catch (logError) {
        console.warn('Failed to log bulk activity:', logError);
      }
      setSelectedItems(new Set());
      
      // Invalidate and refetch to sync with server
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trackKeys.all, refetchType: 'active' }),
        queryClient.refetchQueries({ queryKey: MODERATION_KEY }),
      ]);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to process bulk action");
      // Refetch to restore correct state on error
      await refetch();
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const uniqueGenres = Array.from(new Set(items.filter(i => i.genre).map(i => i.genre)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by title or artist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="track">Tracks Only</SelectItem>
                  <SelectItem value="submission">Submissions Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Genre</Label>
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {uniqueGenres.map(genre => (
                    <SelectItem key={genre} value={genre!}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredItems.length > 0 && (
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedItems.size === filteredItems.length ? "Deselect All" : "Select All"}
              </Button>

              {selectedItems.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size} selected
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleBulkModerate("approve")}
                    disabled={bulkProcessing}
                  >
                    {bulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Approve Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkModerate("reject")}
                    disabled={bulkProcessing}
                  >
                    {bulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                    Reject Selected
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {items.length === 0 
                ? "No content pending moderation" 
                : "No items match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredItems.map((item) => (
          <Card key={item.id} className={selectedItems.has(item.id) ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => toggleSelection(item.id)}
                  className="mt-1"
                />
                <div className="flex items-start justify-between flex-1">
                  <div className="flex items-start gap-3 flex-1">
                    {item.cover_image && (
                      <img 
                        src={item.cover_image} 
                        alt={item.title}
                        className="w-20 h-20 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        By {item.artist_username} ({item.artist_email})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleString()}
                        {item.genre && ` • ${item.genre}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.moderation_status === "flagged" ? "destructive" : "secondary"}>
                    {item.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Preview */}
              {item.audio_url && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Audio Preview</p>
                  </div>
                  <audio controls className="w-full" preload="metadata">
                    <source src={item.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Moderation Notes Input */}
              <div>
                <Label htmlFor={`notes-${item.id}`}>Moderation Notes (optional)</Label>
                <Textarea
                  id={`notes-${item.id}`}
                  placeholder="Add notes for rejection reason or approval comments..."
                  value={notes[item.id] || ""}
                  onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleModerate(item.id, item.type, "approve")}
                  disabled={processingAction !== null}
                  className="flex-1"
                >
                  {processingAction?.id === item.id && processingAction?.action === 'approve' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleModerate(item.id, item.type, "reject")}
                  disabled={processingAction !== null}
                  className="flex-1"
                >
                  {processingAction?.id === item.id && processingAction?.action === 'reject' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
