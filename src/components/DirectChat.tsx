import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowLeft, Loader2, Search } from "lucide-react";

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  unread_count: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function DirectChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`dm-${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();

          // Mark as read if from other user
          if (newMsg.sender_id !== user?.id) {
            markAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      if (!convos?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get other user profiles
      const otherIds = convos.map((c) =>
        c.participant_one === user.id ? c.participant_two : c.participant_one
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", otherIds);

      // Get unread counts
      const { data: unreadData } = await supabase
        .from("direct_messages")
        .select("conversation_id, id")
        .in("conversation_id", convos.map((c) => c.id))
        .neq("sender_id", user.id)
        .is("read_at", null);

      // Get last messages
      const { data: lastMsgs } = await supabase
        .from("direct_messages")
        .select("conversation_id, content")
        .in("conversation_id", convos.map((c) => c.id))
        .order("created_at", { ascending: false });

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      const unreadMap = new Map<string, number>();
      unreadData?.forEach((u) => {
        unreadMap.set(u.conversation_id, (unreadMap.get(u.conversation_id) || 0) + 1);
      });

      const lastMsgMap = new Map<string, string>();
      lastMsgs?.forEach((m) => {
        if (!lastMsgMap.has(m.conversation_id)) {
          lastMsgMap.set(m.conversation_id, m.content);
        }
      });

      const enriched: Conversation[] = convos.map((c) => {
        const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one;
        const profile = profileMap.get(otherId);
        return {
          ...c,
          other_user: {
            id: otherId,
            username: profile?.username || "Unknown",
            display_name: profile?.display_name || profile?.username || "Unknown",
            avatar_url: profile?.avatar_url || null,
          },
          unread_count: unreadMap.get(c.id) || 0,
          last_message: lastMsgMap.get(c.id),
        };
      });

      setConversations(enriched);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (convo: Conversation) => {
    setActiveConversation(convo);
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unread = data?.filter((m) => m.sender_id !== user?.id && !m.read_at) || [];
      if (unread.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unread.map((m) => m.id));

        // Update unread count locally
        setConversations((prev) =>
          prev.map((c) => (c.id === convo.id ? { ...c, unread_count: 0 } : c))
        );
      }

      setTimeout(() => inputRef.current?.focus(), 200);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        content,
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error("Failed to send message");
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const filteredConversations = conversations.filter((c) =>
    c.other_user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col overflow-hidden">
      {activeConversation ? (
        <>
          {/* Chat Header */}
          <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setActiveConversation(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activeConversation.other_user.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {activeConversation.other_user.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{activeConversation.other_user.display_name}</p>
                <p className="text-xs text-muted-foreground">@{activeConversation.other_user.username}</p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                        <span className="text-[10px] opacity-60">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMe && msg.read_at && (
                          <span className="text-[10px] opacity-60">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <>
          {/* Conversation List */}
          <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Messages</CardTitle>
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="text-xs">{totalUnread}</Badge>
                )}
              </div>
            </div>
            <div className="mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Visit an artist's profile to start a conversation
                </p>
              </div>
            ) : (
              filteredConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => openConversation(convo)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border/50 text-left"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={convo.other_user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {convo.other_user.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{convo.other_user.display_name}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(convo.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {convo.last_message || "Start a conversation"}
                      </p>
                      {convo.unread_count > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 min-w-5 flex-shrink-0">
                          {convo.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </>
      )}
    </Card>
  );
}
