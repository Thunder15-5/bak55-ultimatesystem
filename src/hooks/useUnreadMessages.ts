import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadMessages(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUnread = async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_one.eq.${userId},participant_two.eq.${userId}`);

      if (!convos?.length) return;

      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convos.map((c) => c.id))
        .neq("sender_id", userId)
        .is("read_at", null);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    // Listen for new messages
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          if ((payload.new as any).sender_id !== userId) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages" },
        (payload) => {
          if ((payload.new as any).read_at && !(payload.old as any).read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}
