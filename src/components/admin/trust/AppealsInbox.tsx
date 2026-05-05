import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gavel } from "lucide-react";

export function AppealsInbox() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [decision, setDecision] = useState("upheld");
  const [notes, setNotes] = useState("");

  const load = () => supabase.from("appeals" as any).select("*").in("status", ["pending", "under_review"]).order("created_at", { ascending: false }).then(({ data }) => setAppeals((data as any) || []));

  useEffect(() => { load(); }, []);

  const decide = async () => {
    if (!active || !notes.trim()) { toast.error("Decision notes required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("appeals" as any).update({
      status: decision,
      decision_notes: notes,
      decided_by: user?.id,
      decided_at: new Date().toISOString(),
    }).eq("id", active.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Decision recorded");
    setActive(null); setNotes("");
    load();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="h-[500px] flex flex-col">
        <div className="p-3 border-b flex items-center gap-2">
          <Gavel className="h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pending Appeals ({appeals.length})</p>
        </div>
        <ScrollArea className="flex-1">
          {appeals.length === 0 && <p className="p-6 text-xs text-muted-foreground text-center">No pending appeals</p>}
          {appeals.map((a) => (
            <button key={a.id} onClick={() => setActive(a)} className={`w-full text-left p-3 border-b border-border/30 hover:bg-muted/40 ${active?.id === a.id ? "bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs mt-2 line-clamp-2">{a.statement}</p>
            </button>
          ))}
        </ScrollArea>
      </Card>

      <Card className="p-4">
        {!active ? (
          <p className="text-xs text-muted-foreground text-center py-12">Select an appeal to review</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Appellant</p>
              <p className="font-mono text-xs">{active.appellant_id}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Statement</p>
              <p className="text-sm bg-muted/30 p-3 rounded">{active.statement}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Decision</p>
              <div className="flex gap-1 flex-wrap">
                {["upheld", "partial_reversal", "full_reversal", "rejected"].map((d) => (
                  <button key={d} onClick={() => setDecision(d)} className={`text-[11px] px-2 py-1 rounded-full border ${decision === d ? "bg-primary text-primary-foreground border-primary" : "border-border/50"}`}>
                    {d.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <Textarea placeholder="Required: written decision shown to appellant…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-xs" />
            <Button onClick={decide} className="w-full">Record decision</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
