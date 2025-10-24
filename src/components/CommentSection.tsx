import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2, Loader2, Heart } from "lucide-react";
import { commentSchema, sanitizeText, mapDatabaseError } from "@/lib/validation";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  like_count?: number;
  user_has_liked?: boolean;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface CommentSectionProps {
  trackId: string;
}

export function CommentSection({ trackId }: CommentSectionProps) {
  const { user, userRole } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchComments();

    // Set up realtime subscription for new comments
    const channel = supabase
      .channel(`track-comments-${trackId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `track_id=eq.${trackId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`*`)
        .eq("track_id", trackId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const commentRows = data || [];
      const userIds = Array.from(new Set(commentRows.map((c: any) => c.user_id)));

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      if (profileError) throw profileError;

      const profileMap = new Map((profileData || []).map((p: any) => [p.id, p]));

      // Fetch like counts for each comment
      const commentIds = commentRows.map((c: any) => c.id);
      const { data: likesData } = await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds.length ? commentIds : ["00000000-0000-0000-0000-000000000000"]);

      const likeCounts = new Map<string, number>();
      const userLikes = new Set<string>();

      (likesData || []).forEach((like: any) => {
        likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) || 0) + 1);
        if (user && like.user_id === user.id) {
          userLikes.add(like.comment_id);
        }
      });

      const enriched = commentRows.map((c: any) => ({
        ...c,
        profiles: {
          username: profileMap.get(c.user_id)?.username || "User",
          avatar_url: profileMap.get(c.user_id)?.avatar_url || "",
        },
        like_count: likeCounts.get(c.id) || 0,
        user_has_liked: userLikes.has(c.id),
      }));

      setComments(enriched);
    } catch (error: any) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    setSubmitting(true);

    try {
      // Validate and sanitize input
      const validated = commentSchema.parse({
        content: newComment.trim(),
      });
      
      const sanitizedContent = sanitizeText(validated.content);

      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        track_id: trackId,
        content: sanitizedContent,
        parent_id: null,
      });

      if (error) {
        toast.error(mapDatabaseError(error));
        return;
      }

      setNewComment("");
      toast.success("Comment posted!");
      fetchComments();
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to post comment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }

    setSubmitting(true);

    try {
      // Validate and sanitize input
      const validated = commentSchema.parse({
        content: replyContent.trim(),
      });
      
      const sanitizedContent = sanitizeText(validated.content);

      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        track_id: trackId,
        content: sanitizedContent,
        parent_id: parentId,
      });

      if (error) {
        toast.error(mapDatabaseError(error));
        return;
      }

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply posted!");
      fetchComments();
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to post reply");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comment deleted");
      fetchComments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete comment");
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast.error("Please log in to like comments");
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      fetchComments();
    } catch (error: any) {
      toast.error("Failed to update like");
      console.error(error);
    }
  };

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        {user && userRole !== 'fan' && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Post Comment
            </Button>
          </form>
        )}

        {user && userRole === 'fan' && (
          <div className="p-4 border rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Upgrade to Artist to comment on tracks
            </p>
          </div>
        )}

        {!user && (
          <p className="text-center text-muted-foreground">
            Please log in to leave a comment
          </p>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-6">
            {topLevelComments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback>
                      {comment.profiles?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">
                          {comment.profiles?.username}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {user?.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm">{comment.content}</p>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id, comment.user_has_liked || false)}
                        className={comment.user_has_liked ? "text-primary" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${comment.user_has_liked ? "fill-current" : ""}`} />
                        {comment.like_count || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        Reply
                      </Button>
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                          disabled={submitting}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReply(comment.id)}
                            disabled={submitting || !replyContent.trim()}
                          >
                            {submitting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {getReplies(comment.id).length > 0 && (
                      <div className="ml-8 space-y-4 mt-4 border-l-2 pl-4">
                        {getReplies(comment.id).map((reply) => (
                          <div key={reply.id} className="flex gap-4">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reply.profiles?.avatar_url} />
                              <AvatarFallback>
                                {reply.profiles?.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-sm">
                                    {reply.profiles?.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {user?.id === reply.user_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteComment(reply.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm">{reply.content}</p>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikeComment(reply.id, reply.user_has_liked || false)}
                                className={reply.user_has_liked ? "text-primary" : ""}
                              >
                                <Heart className={`h-3 w-3 mr-1 ${reply.user_has_liked ? "fill-current" : ""}`} />
                                {reply.like_count || 0}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
