import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send, Users, Coins, Radio, Heart, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_tip: boolean;
  tip_amount: number;
  created_at: string;
  username?: string;
}

interface StreamViewerProps {
  streamId: string;
  streamTitle: string;
  artistName: string;
  artistId: string;
  isLive: boolean;
  viewerCount: number;
}

// Agora SDK types (loaded dynamically)
let AgoraRTC: any = null;

export function StreamViewer({ streamId, streamTitle, artistName, artistId, isLive, viewerCount }: StreamViewerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [tipAmount, setTipAmount] = useState("5");
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agora state
  const [agoraReady, setAgoraReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number>(0);
  const clientRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);

  const isHost = user?.id === artistId;
  const channelName = `bak55-stream-${streamId}`;

  // Load Agora SDK dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js";
    script.async = true;
    script.onload = () => {
      AgoraRTC = (window as any).AgoraRTC;
      if (AgoraRTC) {
        AgoraRTC.setLogLevel(3); // warnings only
        setAgoraReady(true);
      }
    };
    document.head.appendChild(script);

    return () => {
      leaveChannel();
      document.head.removeChild(script);
    };
  }, []);

  const leaveChannel = useCallback(async () => {
    try {
      if (localTrackRef.current) {
        localTrackRef.current.close();
        localTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
      setConnected(false);
      setRemoteUsers(0);
    } catch (e) {
      console.warn("Leave channel error:", e);
    }
  }, []);

  const joinChannel = useCallback(async () => {
    if (!AgoraRTC || !user || connecting) return;
    setConnecting(true);

    try {
      // Get token from edge function
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      const response = await supabase.functions.invoke("agora-token", {
        body: {
          channelName,
          role: isHost ? "host" : "audience",
          streamId,
        },
      });

      if (response.error) throw new Error(response.error.message || "Failed to get token");

      const { token, uid, appId } = response.data;

      // Create Agora client
      const client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      // Set role
      await client.setClientRole(isHost ? "host" : "audience");

      // Handle remote users
      client.on("user-published", async (remoteUser: any, mediaType: string) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "audio") {
          remoteUser.audioTrack?.play();
        }
        setRemoteUsers((prev) => prev + 1);
      });

      client.on("user-unpublished", () => {
        setRemoteUsers((prev) => Math.max(0, prev - 1));
      });

      client.on("user-left", () => {
        setRemoteUsers((prev) => Math.max(0, prev - 1));
      });

      // Join the channel
      await client.join(appId, channelName, token, uid);
      clientRef.current = client;

      // If host, create and publish audio track
      if (isHost) {
        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        localTrackRef.current = localAudioTrack;
      }

      setConnected(true);
      toast.success(isHost ? "You're broadcasting live! 🎤" : "Connected to stream! 🎧");
    } catch (error: any) {
      console.error("Agora join error:", error);
      toast.error(error.message || "Failed to connect to stream");
    } finally {
      setConnecting(false);
    }
  }, [user, isHost, channelName, streamId, connecting]);

  const toggleMute = useCallback(() => {
    if (localTrackRef.current) {
      localTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Chat functionality
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`stream-chat-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_chat_messages",
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", msg.user_id)
            .single();

          setMessages((prev) => [...prev, { ...msg, username: profile?.username || "User" }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data: msgs } = await supabase
      .from("stream_chat_messages")
      .select("*")
      .eq("stream_id", streamId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!msgs?.length) return;

    const userIds = [...new Set(msgs.map((m) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) || []);

    setMessages(
      msgs.map((m) => ({
        ...m,
        username: profileMap.get(m.user_id) || "User",
      }))
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("stream_chat_messages").insert({
        stream_id: streamId,
        user_id: user.id,
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const sendTip = async () => {
    if (!user) return;
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid tip amount");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("send-tip", {
        body: { artistId, amount },
      });
      if (error) throw error;

      await supabase.from("stream_chat_messages").insert({
        stream_id: streamId,
        user_id: user.id,
        content: `💰 Tipped ${amount} BAKCoins!`,
        is_tip: true,
        tip_amount: amount,
      });

      setTipDialogOpen(false);
      toast.success(`Sent ${amount} BAKCoins tip!`);
    } catch (error: any) {
      toast.error(error.message || "Tip failed");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stream Area */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-0">
            <div className="aspect-video bg-muted/30 rounded-t-lg flex items-center justify-center relative overflow-hidden">
              {isLive ? (
                <>
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    <Badge variant="destructive" className="animate-pulse gap-1">
                      <Radio className="h-3 w-3" /> LIVE
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" /> {viewerCount + remoteUsers}
                    </Badge>
                  </div>

                  {connected ? (
                    <div className="text-center space-y-4">
                      {/* Audio visualizer placeholder */}
                      <div className="flex items-center justify-center gap-1">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 bg-primary rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 60 + 20}px`,
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: `${0.5 + Math.random() * 0.5}s`,
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isHost ? "You are broadcasting" : `Listening to ${artistName}`}
                      </p>

                      {/* Host controls */}
                      {isHost && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <Button
                            variant={isMuted ? "destructive" : "secondary"}
                            size="sm"
                            onClick={toggleMute}
                            className="gap-2"
                          >
                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {isMuted ? "Unmute" : "Mute"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={leaveChannel}>
                            End Broadcast
                          </Button>
                        </div>
                      )}

                      {/* Viewer controls */}
                      {!isHost && (
                        <Button variant="ghost" size="sm" onClick={leaveChannel} className="gap-2">
                          Leave Stream
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Radio className="h-16 w-16 mx-auto text-primary animate-pulse" />
                      <p className="text-lg font-medium">
                        {isHost ? "Start Broadcasting" : "Live Audio Stream"}
                      </p>
                      <Button
                        onClick={joinChannel}
                        disabled={!agoraReady || connecting}
                        size="lg"
                        className="gap-2"
                      >
                        {connecting ? (
                          <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                        ) : isHost ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                        {connecting
                          ? "Connecting..."
                          : isHost
                          ? "Start Broadcasting"
                          : "Join Stream"}
                      </Button>
                      {!agoraReady && (
                        <p className="text-xs text-muted-foreground">Loading streaming engine...</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Radio className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Stream hasn't started yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{streamTitle}</h2>
            <p className="text-muted-foreground">by {artistName}</p>
          </div>
          {isLive && user && user.id !== artistId && (
            <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Send Tip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tip {artistName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 25, 50].map((amt) => (
                      <Button
                        key={amt}
                        variant={tipAmount === String(amt) ? "default" : "outline"}
                        onClick={() => setTipAmount(String(amt))}
                      >
                        {amt} BAK
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Custom amount"
                    min="1"
                  />
                  <Button onClick={sendTip} className="w-full gap-2">
                    <Coins className="h-4 w-4" />
                    Send {tipAmount} BAKCoins
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Live Chat */}
      <Card className="bg-card/50 border-border/50 flex flex-col h-[600px]">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm flex items-center gap-2">
            Live Chat
            {isLive && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Be the first to chat!
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm ${
                  msg.is_tip
                    ? "bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2"
                    : ""
                }`}
              >
                <span className="font-semibold text-primary">{msg.username}</span>
                <span className="text-muted-foreground ml-2">{msg.content}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        {user && isLive && (
          <div className="p-3 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={sending}
              />
              <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
