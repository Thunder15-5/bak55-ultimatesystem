import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PressableButton } from "@/components/PressableButton";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Flame, Zap, Gem, Sparkles, ShieldCheck, Coins, ArrowRight, Hash, Clock, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { actionToast } from "@/lib/actionToast";
import { haptic } from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { VoteSuccessState, VoteSuccessData } from "./VoteSuccessState";
import { FeeSplitBadge } from "@/components/monetization/FeeSplitBadge";

const ARTIST_SHARE = 0.65;
const PLATFORM_SHARE = 0.35;

const TIERS = [
  { id: "cheer", label: "Cheer", qty: 1, icon: Flame, tagline: "Show love" },
  { id: "boost", label: "Boost", qty: 5, icon: Zap, tagline: "Push them up" },
  { id: "champion", label: "Champion", qty: 25, icon: Gem, tagline: "Top supporter" },
] as const;

interface VoteSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  submissionId: string;
  artistId: string;
  artistName: string;
  artistAvatar?: string | null;
  trackTitle: string;
  competitionTitle?: string;
  currentVotes?: number;
  onVoted?: (data: VoteSuccessData) => void;
}

export function VoteSheet({
  open,
  onOpenChange,
  submissionId,
  artistId,
  artistName,
  artistAvatar,
  trackTitle,
  competitionTitle,
  currentVotes,
  onVoted,
}: VoteSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tier, setTier] = useState<typeof TIERS[number]["id"] | "custom">("boost");
  const [customQty, setCustomQty] = useState(10);
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<VoteSuccessData | null>(null);
  const [stage, setStage] = useState<"select" | "review">("select");

  const quantity = tier === "custom" ? customQty : (TIERS.find((t) => t.id === tier)?.qty ?? 1);
  const totalCost = quantity; // 1 BAK per vote
  const artistGets = useMemo(() => (totalCost * ARTIST_SHARE).toFixed(2), [totalCost]);
  const isSelf = user?.id === artistId;
  const insufficient = balance !== null && balance < totalCost;

  useEffect(() => {
    if (!open || !user) return;
    setSuccess(null);
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setBalance(Number(data?.balance ?? 0)));
  }, [open, user]);

  const handleVote = async () => {
    if (!user) {
      navigate(`/login?redirect=/rising-stars/voting`);
      return;
    }
    if (insufficient) {
      navigate(`/buy-coins?need=${totalCost}&return=/rising-stars/voting`);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("vote-submission", {
        body: { submission_id: submissionId, quantity },
      });
      if (error || data?.error) {
        let body: any = data;
        try { if (error?.context) body = await error.context.json(); } catch {}
        if (body?.code === "INSUFFICIENT_BALANCE") {
          setBalance(Number(body.current_balance ?? 0));
          toast({ title: "Need more BAKCoins", description: `You need ${body.required} BAK.`, variant: "destructive" });
          return;
        }
        toast({ title: "Vote failed", description: body?.error || "Try again.", variant: "destructive" });
        return;
      }
      // Haptic
      if (navigator.vibrate) navigator.vibrate([20, 30, 40]);
      const successData: VoteSuccessData = {
        artistId,
        artistName,
        artistAvatar: artistAvatar || undefined,
        trackTitle,
        quantity,
        totalCost,
        artistEarned: Number(data.artist_earned),
        newBalance: Number(data.new_balance),
        voterTotalVotes: Number(data.voter_total_votes_on_submission ?? quantity),
        totalVotes: Number(data.total_votes_for_submission ?? 0),
        voteId: data.vote_id,
        competitionTitle,
      };
      setSuccess(successData);
      onVoted?.(successData);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to vote", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
      >
        {success ? (
          <VoteSuccessState
            data={success}
            onClose={() => { setSuccess(null); onOpenChange(false); }}
            onCheerAgain={() => { setSuccess(null); }}
          />
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border/40">
              <SheetHeader className="text-left space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                    <AvatarImage src={artistAvatar || undefined} />
                    <AvatarFallback>{artistName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base truncate">{artistName}</SheetTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      {competitionTitle && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">{competitionTitle}</Badge>
                      )}
                      {typeof currentVotes === "number" && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {currentVotes.toLocaleString()} votes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Backing <span className="text-foreground font-medium">"{trackTitle}"</span>
                </p>
              </SheetHeader>
            </div>

            {/* Tiers */}
            <div className="px-5 pt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {TIERS.map((t) => {
                  const Icon = t.icon;
                  const active = tier === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      className={`relative rounded-xl border p-3 text-left transition-all min-h-[88px] ${
                        active
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <Icon className={`h-4 w-4 mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-sm font-semibold">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground">{t.qty} BAK</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.tagline}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom */}
              <button
                onClick={() => setTier("custom")}
                className={`w-full rounded-xl border p-3 transition-all ${
                  tier === "custom" ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Custom</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {tier === "custom" ? customQty : "—"} BAK
                  </span>
                </div>
                {tier === "custom" && (
                  <Slider
                    value={[customQty]}
                    onValueChange={(v) => setCustomQty(v[0])}
                    min={1}
                    max={25}
                    step={1}
                    className="mt-1"
                  />
                )}
              </button>
            </div>

            {/* Impact preview */}
            <div className="mx-5 mt-4 rounded-xl bg-muted/40 border border-border/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Your impact</span>
                <span className="font-semibold tabular-nums">+{quantity} vote{quantity > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Artist receives</span>
                <span className="font-semibold text-primary tabular-nums">{artistGets} BAK</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Prize pool</span>
                <span className="tabular-nums">{(totalCost * PLATFORM_SHARE).toFixed(2)} BAK</span>
              </div>
              {isSelf && (
                <div className="text-[11px] text-warning flex items-center gap-1 pt-1 border-t border-border/40">
                  <ShieldCheck className="h-3 w-3" /> Self-vote · counted separately, max 10/day
                </div>
              )}
            </div>

            {/* Trust bar */}
            <div className="mx-5 mt-3 flex items-center justify-between gap-2">
              <FeeSplitBadge
                artistShare={65}
                prizePoolShare={35}
                label="65% artist · 35% prize pool"
                title="Where your BAK goes"
                footnote="Audited daily. Every vote logged on the public ledger."
              />
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-success" /> Verified
              </span>
            </div>

            {/* Sticky CTA */}
            <div className="sticky bottom-0 mt-4 px-5 pt-3 pb-5 bg-background/95 backdrop-blur border-t border-border/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3 w-3" /> Balance
                </span>
                <span className="font-medium tabular-nums">
                  {balance === null ? "…" : `${balance.toFixed(2)} BAK`}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                onClick={handleVote}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                ) : insufficient ? (
                  <>Top up & send {quantity} vote{quantity > 1 ? "s" : ""} <ArrowRight className="h-4 w-4 ml-2" /></>
                ) : (
                  <>Send {totalCost} BAK · Back {artistName.split(" ")[0]}</>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Secure payment · Vote logged on public ledger
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
