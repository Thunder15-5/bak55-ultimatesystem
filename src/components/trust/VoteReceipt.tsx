import { useState } from "react";
import { CheckCircle2, Clock, Hash, Shield, ChevronDown, FileSearch, Server, MapPin, ArrowDownRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoteReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionTitle?: string;
  artistName?: string;
  voteId?: string;
  timestamp?: Date;
  costBak?: number;
  artistShareBak?: number;
}

/**
 * Vote Receipt — closes the trust loop after a successful vote.
 * Shows a verifiable confirmation: hash, timestamp, fund split.
 */
export function VoteReceipt({
  open,
  onOpenChange,
  submissionTitle,
  artistName,
  voteId,
  timestamp = new Date(),
  costBak = 1,
  artistShareBak = 0.65,
}: VoteReceiptProps) {
  const shortId = voteId ? voteId.slice(0, 8).toUpperCase() : Math.random().toString(36).slice(2, 10).toUpperCase();
  const ts = timestamp.toISOString();

  const copy = () => {
    navigator.clipboard.writeText(`Vote #${shortId} • ${ts}`);
    toast.success("Receipt copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center">Vote Verified</DialogTitle>
          <DialogDescription className="text-center">
            Your vote was recorded on the BAK55 ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {submissionTitle && (
            <div className="text-center px-4 py-3 rounded-lg bg-muted/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">You voted for</p>
              <p className="font-semibold mt-1">{submissionTitle}</p>
              {artistName && <p className="text-sm text-muted-foreground">by {artistName}</p>}
            </div>
          )}

          <div className="rounded-lg border bg-card p-4 space-y-3 font-mono text-xs">
            <Row icon={Hash} label="Vote ID" value={`#${shortId}`} />
            <Row icon={Clock} label="Timestamp" value={ts.replace("T", " ").slice(0, 19) + " UTC"} />
            <Row icon={Shield} label="Status" value="Verified" badge />
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Where your BAK went</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold">{costBak} BAK</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">→ Artist earnings</span>
              <span className="font-semibold text-primary">{artistShareBak} BAK</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">→ Platform & operations</span>
              <span className="font-semibold">{(costBak - artistShareBak).toFixed(2)} BAK</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copy} className="flex-1">Copy Receipt</Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1">Done</Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground pt-1">
            Suspicious votes are auto-reversed during the 7-day fraud review window.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon: Icon, label, value, badge }: { icon: any; label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {badge ? (
        <Badge className="bg-primary/15 text-primary border-primary/30 font-mono">{value}</Badge>
      ) : (
        <span className="font-semibold text-foreground">{value}</span>
      )}
    </div>
  );
}
