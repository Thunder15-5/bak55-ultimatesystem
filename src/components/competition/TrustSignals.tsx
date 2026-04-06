import { ShieldCheck, Eye, Bot, Scale } from "lucide-react";

export function TrustSignals() {
  const signals = [
    { icon: ShieldCheck, label: "Anti-Fraud Protection", description: "Votes monitored 24/7" },
    { icon: Bot, label: "AI-Verified Scoring", description: "Unbiased expert analysis" },
    { icon: Eye, label: "Transparent Results", description: "Public vote counts" },
    { icon: Scale, label: "Fair Rules", description: "Self-vote limits enforced" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {signals.map((signal) => {
        const Icon = signal.icon;
        return (
          <div
            key={signal.label}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold leading-tight">{signal.label}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{signal.description}</span>
          </div>
        );
      })}
    </div>
  );
}
