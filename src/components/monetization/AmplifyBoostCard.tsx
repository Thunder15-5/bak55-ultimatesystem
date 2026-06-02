import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, Eye, UserPlus, Sparkles, ShieldCheck, Info } from "lucide-react";
import { FeeSplitBadge } from "./FeeSplitBadge";
import { PlacementBadge } from "./PlacementBadge";
import { cn } from "@/lib/utils";

export interface AmplifyBoostTier {
  id: string;
  name: string;
  description: string;
  bakPrice: number;
  durationDays: number;
  predictedImpressionsMin: number;
  predictedImpressionsMax: number;
  predictedNewFansMin: number;
  predictedNewFansMax: number;
  placements: string[];
}

const DEFAULT_TIERS: AmplifyBoostTier[] = [
  {
    id: "spark",
    name: "Spark",
    description: "A gentle nudge into discovery shelves",
    bakPrice: 50,
    durationDays: 3,
    predictedImpressionsMin: 1_200,
    predictedImpressionsMax: 2_400,
    predictedNewFansMin: 8,
    predictedNewFansMax: 22,
    placements: ["Discover shelf", "Genre carousel"],
  },
  {
    id: "wave",
    name: "Wave",
    description: "Sustained 7-day push across discovery surfaces",
    bakPrice: 150,
    durationDays: 7,
    predictedImpressionsMin: 5_500,
    predictedImpressionsMax: 9_800,
    predictedNewFansMin: 45,
    predictedNewFansMax: 110,
    placements: ["Discover shelf", "Genre carousel", "Rising Stars row"],
  },
  {
    id: "surge",
    name: "Surge",
    description: "Two-week premium placement with retargeting",
    bakPrice: 400,
    durationDays: 14,
    predictedImpressionsMin: 18_000,
    predictedImpressionsMax: 32_000,
    predictedNewFansMin: 180,
    predictedNewFansMax: 420,
    placements: ["Home featured row", "Discover shelf", "Genre carousel", "Push notification (opt-in fans)"],
  },
];

interface AmplifyBoostCardProps {
  tiers?: AmplifyBoostTier[];
  onLaunch?: (tier: AmplifyBoostTier, audienceLevel: number) => void;
  className?: string;
}

/**
 * Amplify Boost — transparent paid promotion for artists.
 *
 * Phase-2 monetization primitive: pre-spend prediction with placement
 * disclosure (always marked "Promoted"), audience-tightening slider, and
 * a no-fluff range for impressions + new fans. Pricing splits are surfaced
 * via FeeSplitBadge so artists know exactly where each BAK goes.
 */
export function AmplifyBoostCard({ tiers = DEFAULT_TIERS, onLaunch, className }: AmplifyBoostCardProps) {
  const [selectedId, setSelectedId] = useState(tiers[1]?.id ?? tiers[0].id);
  const [audience, setAudience] = useState<number[]>([60]); // 0 = broad, 100 = laser-targeted

  const selected = useMemo(
    () => tiers.find((t) => t.id === selectedId) ?? tiers[0],
    [tiers, selectedId]
  );

  // Audience targeting tightens reach but raises fan-conversion rate.
  // We model this as a simple linear curve clients can override later.
  const tightness = audience[0] / 100;
  const reachMultiplier = 1 - tightness * 0.45; // tighter = fewer impressions
  const conversionMultiplier = 1 + tightness * 0.6; // tighter = better conversion

  const impressionsLow = Math.round(selected.predictedImpressionsMin * reachMultiplier);
  const impressionsHigh = Math.round(selected.predictedImpressionsMax * reachMultiplier);
  const fansLow = Math.round(selected.predictedNewFansMin * conversionMultiplier);
  const fansHigh = Math.round(selected.predictedNewFansMax * conversionMultiplier);

  const costPerThousand = (selected.bakPrice / ((impressionsLow + impressionsHigh) / 2)) * 1000;
  const costPerFan = selected.bakPrice / ((fansLow + fansHigh) / 2);

  return (
    <Card className={cn("border-primary/20 overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-amber-500/5 border-b border-primary/15">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-primary" />
              Amplify Boost
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Paid promotion with honest predictions. Every boost is publicly
              labeled <span className="font-semibold">Promoted</span> — fans
              always know what they're seeing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PlacementBadge variant="promoted" />
            <FeeSplitBadge
              artistShare={0}
              platformShare={100}
              label="Where it goes"
              title="Amplify Boost — cost breakdown"
              lines={[
                "100% covers placement, ad delivery & analytics",
                "0% commission on tips or earnings you generate from it",
                "Refundable as BAK credit if under 50% of predicted reach delivers",
              ]}
              footnote="Predictions are estimates, not guarantees. Disclosed before payment."
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5">
        {/* Tier picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {tiers.map((tier) => {
            const active = tier.id === selectedId;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedId(tier.id)}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[44px]",
                  active
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{tier.name}</span>
                  {tier.id === "wave" && (
                    <Badge variant="secondary" className="text-[10px]">Popular</Badge>
                  )}
                </div>
                <div className="text-lg font-bold text-primary">{tier.bakPrice} BAK</div>
                <div className="text-[11px] text-muted-foreground">{tier.durationDays} days</div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{tier.description}</p>
              </button>
            );
          })}
        </div>

        {/* Audience targeting */}
        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Audience targeting
            </label>
            <span className="text-xs font-medium">
              {tightness < 0.33 ? "Broad reach" : tightness < 0.66 ? "Balanced" : "Laser-targeted"}
            </span>
          </div>
          <Slider value={audience} onValueChange={setAudience} max={100} step={5} />
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Tighter targeting reaches fewer fans but converts more of them.
          </p>
        </div>

        {/* Prediction */}
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
              Predicted results
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Modeled on similar boosts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-background/60 p-3 border">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                <Eye className="h-3 w-3" />
                Impressions
              </div>
              <div className="text-lg font-bold">
                {impressionsLow.toLocaleString()}–{impressionsHigh.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                ~{costPerThousand.toFixed(2)} BAK / 1K
              </div>
            </div>
            <div className="rounded-lg bg-background/60 p-3 border">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                <UserPlus className="h-3 w-3" />
                New fans
              </div>
              <div className="text-lg font-bold">
                {fansLow}–{fansHigh}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                ~{costPerFan.toFixed(1)} BAK / fan
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-primary/15">
            <div className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Where you'll show up
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.placements.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-normal">
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3 w-3 mt-0.5 text-emerald-600 shrink-0" />
            <span>
              Every placement is labeled <span className="font-semibold">Promoted</span> to fans.
              We never disguise paid placement as editorial.
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => onLaunch?.(selected, audience[0])}
        >
          <Rocket className="mr-2 h-4 w-4" />
          Launch {selected.name} · {selected.bakPrice} BAK
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          Predictions are estimates. If your boost delivers under 50% of the predicted reach,
          the difference is refunded as BAK credit automatically.
        </p>
      </CardContent>
    </Card>
  );
}
