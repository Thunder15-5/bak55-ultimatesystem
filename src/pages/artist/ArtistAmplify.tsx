import { useState } from "react";
import { toast } from "sonner";
import { AmplifyBoostCard, type AmplifyBoostTier } from "@/components/monetization/AmplifyBoostCard";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Eye, Megaphone } from "lucide-react";

export default function ArtistAmplify() {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async (tier: AmplifyBoostTier, audience: number) => {
    setLaunching(true);
    try {
      // Phase 2: edge function wiring lands with the Amplify campaigns table.
      // For now we surface the predicted plan so artists can review it.
      toast.success(`${tier.name} Boost queued`, {
        description: `${tier.bakPrice} BAK · ${tier.durationDays} days · targeting ${audience}/100. We'll confirm before charging.`,
      });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Amplify Boost</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pay to reach more fans — without buying votes or rankings.
            Every Amplify placement is publicly labeled <span className="font-semibold">Promoted</span>,
            and predicted results are shown before you spend a single BAK.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { icon: Eye, title: "Honest predictions", body: "Impression and fan ranges based on similar boosts." },
            { icon: Megaphone, title: "Labeled Promoted", body: "Fans always see when a placement is paid." },
            { icon: ShieldCheck, title: "Auto-refund", body: "Below 50% predicted reach? Difference returns as BAK." },
          ].map((it) => (
            <Card key={it.title}>
              <CardContent className="p-3 flex gap-2">
                <it.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">{it.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{it.body}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AmplifyBoostCard onLaunch={handleLaunch} />

        <p className="text-[11px] text-center text-muted-foreground">
          Amplify never affects competition rankings, vote weights, or editorial picks.
        </p>
      </div>
    </div>
  );
}
