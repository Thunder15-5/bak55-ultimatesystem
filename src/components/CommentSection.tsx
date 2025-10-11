import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { commentSchema, sanitizeText, mapDatabaseError } from "@/lib/validation";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface CommentSectionProps {
  trackId: string;
}

export function CommentSection({ trackId }: CommentSectionProps) {
  const { user } = useAuth();
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
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq("track_id", trackId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
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
        {user && (
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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      Reply
                    </Button>

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
