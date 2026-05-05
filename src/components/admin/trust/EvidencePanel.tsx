import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Network, Users, Receipt, FileText } from "lucide-react";

interface Props {
  subjectType: string | null;
  subjectId: string | null;
}

export function EvidencePanel({ subjectType, subjectId }: Props) {
  const [activity, setActivity] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [linked, setLinked] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    if (!subjectId) return;
    (async () => {
      // Recent activity (votes if voter, votes received if artist)
      const { data: voteRows } = await supabase
        .from("votes")
        .select("id, created_at, submission_id, voter_id")
        .or(subjectType === "artist" ? `voter_id.eq.${subjectId}` : `voter_id.eq.${subjectId}`)
        .order("created_at", { ascending: false })
        .limit(25);
      setActivity(voteRows || []);

      // Account signals
      const { data: sigRows } = await supabase
        .from("account_signals" as any)
        .select("*")
        .eq("user_id", subjectId)
        .order("last_seen", { ascending: false })
        .limit(50);
      setSignals((sigRows as any) || []);

      // Linked accounts via shared signals
      if (sigRows && sigRows.length) {
        const values = (sigRows as any[]).map((s) => s.signal_value);
        const { data: shared } = await supabase
          .from("account_signals" as any)
          .select("user_id, signal_type, signal_value")
          .in("signal_value", values)
          .neq("user_id", subjectId)
          .limit(50);
        setLinked((shared as any) || []);
      }

      // Past enforcement
      const { data: enf } = await supabase
        .from("enforcement_actions" as any)
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false })
        .limit(20);
      setActions((enf as any) || []);
    })();
  }, [subjectId, subjectType]);

  if (!subjectId) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground h-full">
        Select a case to view evidence
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Evidence</p>
        <p className="font-mono text-xs truncate">{subjectId}</p>
      </div>
      <Tabs defaultValue="activity" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 grid grid-cols-4 h-9">
          <TabsTrigger value="activity" className="text-xs"><Activity className="h-3 w-3 mr-1" />Activity</TabsTrigger>
          <TabsTrigger value="network" className="text-xs"><Network className="h-3 w-3 mr-1" />Network</TabsTrigger>
          <TabsTrigger value="linked" className="text-xs"><Users className="h-3 w-3 mr-1" />Linked</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs"><FileText className="h-3 w-3 mr-1" />Actions</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-3">
          <TabsContent value="activity" className="space-y-2 mt-0">
            {activity.length === 0 && <p className="text-xs text-muted-foreground">No recent votes</p>}
            {activity.map((v) => (
              <div key={v.id} className="text-xs p-2 rounded border border-border/50 bg-muted/30">
                <div className="flex justify-between">
                  <span className="font-mono">vote</span>
                  <span className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
                </div>
                <p className="font-mono text-[10px] truncate text-muted-foreground">→ {v.submission_id}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="network" className="space-y-2 mt-0">
            {signals.length === 0 && <p className="text-xs text-muted-foreground">No signals captured</p>}
            {signals.map((s) => (
              <div key={s.id} className="text-xs p-2 rounded border border-border/50 flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-[10px] mr-2">{s.signal_type}</Badge>
                  <span className="font-mono">{s.signal_value}</span>
                </div>
                <span className="text-muted-foreground">×{s.occurrence_count}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="linked" className="space-y-2 mt-0">
            {linked.length === 0 && <p className="text-xs text-muted-foreground">No linked accounts</p>}
            {linked.map((l, i) => (
              <div key={i} className="text-xs p-2 rounded border border-border/50">
                <p className="font-mono truncate">{l.user_id}</p>
                <p className="text-[10px] text-muted-foreground">via {l.signal_type}: {l.signal_value}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="actions" className="space-y-2 mt-0">
            {actions.length === 0 && <p className="text-xs text-muted-foreground">No prior enforcement</p>}
            {actions.map((a) => (
              <div key={a.id} className="text-xs p-2 rounded border border-border/50">
                <div className="flex justify-between">
                  <Badge variant={a.status === "executed" ? "destructive" : "secondary"} className="text-[10px]">
                    {a.action_type}
                  </Badge>
                  <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{a.reason_code}</p>
              </div>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
