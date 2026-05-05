import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    supabase.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setLogs(data || []));
  }, []);

  const filtered = logs.filter((l) => {
    if (category !== "all" && l.event_category !== category) return false;
    if (filter && !(l.description?.toLowerCase().includes(filter.toLowerCase()) || l.event_type?.toLowerCase().includes(filter.toLowerCase()))) return false;
    return true;
  });

  const exportCsv = () => {
    const rows = ["timestamp,event_type,category,description,user_id"].concat(
      filtered.map((l) => `"${l.created_at}","${l.event_type}","${l.event_category}","${(l.description || "").replace(/"/g, '""')}","${l.user_id || ""}"`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const categories = Array.from(new Set(logs.map((l) => l.event_category).filter(Boolean)));

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Audit Log</p>
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-1" /> CSV
          </Button>
        </div>
        <Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 text-xs" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCategory("all")} className={`text-[10px] px-2 py-1 rounded-full border ${category === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50"}`}>all</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`text-[10px] px-2 py-1 rounded-full border ${category === c ? "bg-primary text-primary-foreground border-primary" : "border-border/50"}`}>{c}</button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.map((l) => (
          <div key={l.id} className="p-3 border-b border-border/30 text-xs">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="text-[10px]">{l.event_type}</Badge>
              <span className="text-muted-foreground text-[10px]">{new Date(l.created_at).toLocaleString()}</span>
            </div>
            <p className="text-muted-foreground">{l.description}</p>
            {l.user_id && <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">actor: {l.user_id}</p>}
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
}
