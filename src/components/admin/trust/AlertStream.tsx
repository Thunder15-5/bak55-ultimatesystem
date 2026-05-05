import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, Bell, Loader2 } from "lucide-react";

export function AlertStream() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const load = () => supabase.from("fraud_alerts" as any).select("*").eq("status", "open").order("severity", { ascending: false }).order("created_at", { ascending: false }).limit(50).then(({ data }) => setAlerts((data as any) || []));

  useEffect(() => {
    load();
    const ch = supabase.channel("fraud-alerts").on("postgres_changes", { event: "*", schema: "public", table: "fraud_alerts" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const { error } = await supabase.functions.invoke("fraud-scan", { body: {} });
      if (error) throw error;
      toast.success("Scan complete");
      load();
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("fraud_alerts" as any).update({ status }).eq("id", id);
    load();
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Live Alerts</p>
        </div>
        <Button size="sm" variant="outline" onClick={runScan} disabled={scanning} className="h-7 text-xs">
          {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run scan"}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {alerts.length === 0 && (
          <p className="p-6 text-center text-xs text-muted-foreground">No open alerts. Run a scan to check now.</p>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="p-3 border-b border-border/30">
            <div className="flex items-start gap-2 mb-1">
              <AlertCircle className={`h-4 w-4 shrink-0 ${a.severity === "critical" ? "text-destructive" : a.severity === "high" ? "text-orange-500" : "text-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] uppercase">{a.severity}</Badge>
                  <span className="text-xs font-medium">{a.rule_name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  {a.evidence?.summary || `Subject: ${a.subject_id?.slice(0, 8)}`}
                </p>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "escalated")} className="h-6 text-[10px] flex-1">Escalate</Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "snoozed")} className="h-6 text-[10px] flex-1">Snooze</Button>
              <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "benign")} className="h-6 text-[10px] flex-1">Benign</Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
}
