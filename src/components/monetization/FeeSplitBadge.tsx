import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FeeSplitBadgeProps {
  artistShare: number; // 0–100
  platformShare?: number;
  prizePoolShare?: number;
  label?: string;
  className?: string;
}

/**
 * Universal disclosure pill shown next to any "spend" CTA.
 * Makes fee splits visible BEFORE the user pays — never after.
 */
export function FeeSplitBadge({
  artistShare,
  platformShare = 0,
  prizePoolShare = 0,
  label,
  className,
}: FeeSplitBadgeProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition",
              className
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {label ?? `${artistShare}% to artist`}
            <Info className="h-3 w-3 opacity-70" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          <p className="font-semibold mb-1">Where your money goes</p>
          <ul className="space-y-0.5">
            <li>• {artistShare}% to the artist</li>
            {prizePoolShare > 0 && <li>• {prizePoolShare}% to the prize pool</li>}
            {platformShare > 0 && <li>• {platformShare}% platform fee</li>}
          </ul>
          <p className="mt-2 text-muted-foreground">Always disclosed before you pay.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
