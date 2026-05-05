import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, Ban, AlertTriangle, Slash, Trash2, Undo2 } from "lucide-react";

const ACTIONS = [
  { id: "warn", label: "Warn", icon: AlertTriangle, severity: "low", needs2: false },
  { id: "restrict", label: "Restrict", icon: Slash, severity: "low", needs2: false },
  { id: "invalidate_votes", label: "Invalidate Votes", icon: Undo2, severity: "high", needs2: true },
  { id: "suspend", label: "Suspend Account", icon: ShieldAlert, severity: "high", needs2: true },
  { id: "disqualify", label: "Disqualify", icon: Trash2, severity: "high", needs2: true },
  { id: "ban", label: "Ban", icon: Ban, severity: "critical", needs2: true },
];

const REASON_CODES = [
  "vote_manipulation", "duplicate_account", "vote_buying", "self_voting_abuse",
  "bot_activity", "tos_violation", "fraud_payment", "content_violation", "other"
];

export function EnforcementBar({
  caseId, subjectType, subjectId, onActionTaken,
}: {
  caseId?: string; subjectType: string; subjectId: string; onActionTaken?: () => void;
}) {
  const [selected, setSelected] = useState<string>("warn");
  const [reason, setReason] = useState<string>("vote_manipulation");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const action = ACTIONS.find((a) => a.id === selected)!;

  const submit = async () => {
    if (!notes.trim()) {
      toast.error("Notes required for enforcement actions");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("enforcement-execute", {
        body: {
          case_id: caseId,
          action_type: action.id,
          subject_type: subjectType,
          subject_id: subjectId,
          reason_code: reason,
          notes,
          requires_second_admin: action.needs2,
        },
      });
      if (error) throw error;
      toast.success(action.needs2 ? "Action proposed — awaiting second admin approval" : "Action executed");
      setNotes("");
      onActionTaken?.();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 space-y-3 border-destructive/30">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Enforcement</p>
        {action.needs2 && (
          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
            Requires 2-admin approval
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const active = selected === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-md border text-[10px] transition ${
                active ? "border-primary bg-primary/10 text-primary" : "border-border/50 hover:bg-muted/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REASON_CODES.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">{r.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Required: explain the decision and evidence basis…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="text-xs"
      />

      <Button onClick={submit} disabled={busy} variant={action.severity === "critical" ? "destructive" : "default"} className="w-full">
        {busy ? "Processing…" : action.needs2 ? "Propose action" : "Execute action"}
      </Button>
    </Card>
  );
}
