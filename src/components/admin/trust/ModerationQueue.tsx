import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertTriangle } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500/90 text-white",
  medium: "bg-amber-500/90 text-white",
  low: "bg-muted text-muted-foreground",
};

export function ModerationQueue({
  selectedId, onSelect,
}: { selectedId: string | null; onSelect: (c: any) => void }) {
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [severity, setSeverity] = useState<string>("all");

  useEffect(() => {
    let q = supabase.from("fraud_cases" as any).select("*").neq("status", "resolved").neq("status", "dismissed").order("severity", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    q.then(({ data }) => setCases((data as any) || []));

    const channel = supabase.channel("fraud-cases")
      .on("postgres_changes", { event: "*", schema: "public", table: "fraud_cases" }, () => {
        supabase.from("fraud_cases" as any).select("*").neq("status", "resolved").neq("status", "dismissed").order("created_at", { ascending: false }).limit(100).then(({ data }) => setCases((data as any) || []));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = cases.filter((c) => {
    if (severity !== "all" && c.severity !== severity) return false;
    if (filter && !c.title.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const counts = {
    critical: cases.filter((c) => c.severity === "critical").length,
    high: cases.filter((c) => c.severity === "high").length,
    medium: cases.filter((c) => c.severity === "medium").length,
    low: cases.filter((c) => c.severity === "low").length,
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Queue</p>
          <span className="text-xs text-muted-foreground">{filtered.length}</span>
        </div>
        <Input placeholder="Search cases…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 text-xs" />
        <div className="flex gap-1 flex-wrap">
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`text-[10px] px-2 py-1 rounded-full border transition ${severity === s ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-muted/50"}`}
            >
              {s} {s !== "all" && `(${counts[s as keyof typeof counts]})`}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-xs text-muted-foreground">No open cases</p>
        )}
        {filtered.map((c) => {
          const overdue = c.sla_due_at && new Date(c.sla_due_at) < new Date();
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full text-left p-3 border-b border-border/30 transition hover:bg-muted/40 ${selectedId === c.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
            >
              <div className="flex items-start gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold ${SEVERITY_COLORS[c.severity]}`}>
                  {c.severity}
                </span>
                {overdue && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
              </div>
              <p className="text-sm font-medium mt-1 line-clamp-2">{c.title}</p>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{c.subject_type}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          );
        })}
      </ScrollArea>
    </Card>
  );
}
