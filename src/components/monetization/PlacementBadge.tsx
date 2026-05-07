import { Sparkles, Megaphone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Variant = "curated" | "promoted";

interface PlacementBadgeProps {
  variant: Variant;
  className?: string;
}

/**
 * Differentiates editorial picks from paid placements.
 * MUST appear on every featured/spotlighted card to preserve trust.
 */
export function PlacementBadge({ variant, className }: PlacementBadgeProps) {
  const config =
    variant === "curated"
      ? {
          icon: Sparkles,
          label: "Curated",
          tip: "Hand-picked by the BAK55 editorial team. Never paid.",
          classes: "border-primary/30 bg-primary/10 text-primary",
        }
      : {
          icon: Megaphone,
          label: "Promoted",
          tip: "This artist paid to amplify their reach. Ranking is not affected.",
          classes: "border-accent/40 bg-accent/10 text-accent-foreground",
        };

  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              config.classes,
              className
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">
          {config.tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
