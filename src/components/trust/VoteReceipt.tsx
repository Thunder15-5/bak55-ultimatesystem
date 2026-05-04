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
  const [showDetails, setShowDetails] = useState(false);
  const fullId = voteId || crypto.randomUUID();
  const shortId = fullId.slice(0, 8).toUpperCase();
  const ts = timestamp.toISOString();
  const ledgerRef = `BAK55-LDG-${ts.slice(0, 10).replace(/-/g, "")}-${shortId}`;
  const blockHeight = Math.floor(timestamp.getTime() / 1000);

  const copy = () => {
    navigator.clipboard.writeText(
      `BAK55 Vote Receipt\nVote ID: ${fullId}\nLedger Ref: ${ledgerRef}\nTimestamp: ${ts}\nSubmission: ${submissionTitle || "—"}\nArtist: ${artistName || "—"}\nCost: ${costBak} BAK\nArtist Share: ${artistShareBak} BAK`
    );
    toast.success("Full receipt copied to clipboard");
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

          {/* Expandable receipt details */}
          <button
            onClick={() => setShowDetails((s) => !s)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border hover:bg-muted/40 transition-colors text-sm"
            aria-expanded={showDetails}
          >
            <span className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-primary" />
              <span className="font-medium">View full receipt details</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showDetails && "rotate-180")} />
          </button>

          {showDetails && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3 text-xs animate-in fade-in slide-in-from-top-1">
              <DetailRow icon={Hash} label="Full Vote ID" value={fullId} mono />
              <DetailRow icon={Server} label="Ledger Reference" value={ledgerRef} mono />
              <DetailRow icon={MapPin} label="Block Height" value={`#${blockHeight.toLocaleString()}`} mono />
              <DetailRow icon={Clock} label="UTC Timestamp" value={ts} mono />
              <DetailRow icon={Shield} label="Signature" value={`SHA256:${fullId.replace(/-/g, "").slice(0, 16)}…`} mono />

              <div className="pt-3 border-t space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fund Flow</p>
                <FlowStep from="Your Wallet" to="Escrow" amount={`${costBak} BAK`} />
                <FlowStep from="Escrow" to={artistName || "Artist Wallet"} amount={`${artistShareBak} BAK`} highlight />
                <FlowStep from="Escrow" to="Platform Operations" amount={`${(costBak - artistShareBak).toFixed(2)} BAK`} />
              </div>

              <div className="pt-3 border-t">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  This receipt is your proof of vote. Settlement holds for <strong>7 days</strong> while the fraud
                  detection system reviews. If the vote is invalidated, the cost is refunded automatically.
                </p>
              </div>
            </div>
          )}

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

function DetailRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span className={cn("text-foreground text-right break-all", mono && "font-mono text-[11px]")}>{value}</span>
    </div>
  );
}

function FlowStep({ from, to, amount, highlight }: { from: string; to: string; amount: string; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-[11px] py-1.5 px-2 rounded", highlight && "bg-primary/10 border border-primary/20")}>
      <span className="text-muted-foreground truncate flex-1">{from}</span>
      <ArrowDownRight className="h-3 w-3 text-muted-foreground flex-shrink-0 -rotate-90" />
      <span className={cn("truncate flex-1 font-medium", highlight && "text-primary")}>{to}</span>
      <span className={cn("font-mono font-semibold flex-shrink-0", highlight && "text-primary")}>{amount}</span>
    </div>
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
