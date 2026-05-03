import { useEffect, useState } from "react";
import { Activity, Vote, Trophy, ShieldAlert, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  type: "vote" | "winner" | "moderation" | "payout";
  message: string;
  at: string;
}

const ICONS = {
  vote: Vote,
  winner: Trophy,
  moderation: ShieldAlert,
  payout: Coins,
};

/**
 * Public live audit feed — pulls from admin_activity_log.
 * Shows that the platform is actively moderated and operating in the open.
 */
export function LiveAuditFeed({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("admin_activity_log" as any)
        .select("id, event_type, event_category, description, created_at")
        .in("event_category", ["competition", "moderation", "payment", "fan"])
        .order("created_at", { ascending: false })
        .limit(limit);
      const mapped: FeedItem[] = (data || []).map((r: any) => ({
        id: r.id,
        type:
          r.event_category === "moderation"
            ? "moderation"
            : r.event_category === "payment"
            ? "payout"
            : r.event_type?.includes("winner")
            ? "winner"
            : "vote",
        message: r.description || "Platform action",
        at: r.created_at,
      }));
      setItems(mapped);
      setLoading(false);
    };
    load();
  }, [limit]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Live Platform Activity</p>
          <p className="text-xs text-muted-foreground">Public audit log — last {limit} events</p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
          Live
        </Badge>
      </div>
      <div className="divide-y">
        {loading && <p className="p-4 text-sm text-muted-foreground text-center">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground text-center">No recent activity</p>
        )}
        {items.map((it) => {
          const Icon = ICONS[it.type] || Activity;
          return (
            <div key={it.id} className="flex items-start gap-3 p-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{it.message}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(it.at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
