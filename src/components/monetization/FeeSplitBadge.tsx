import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FeeSplitBadgeProps {
  artistShare?: number; // 0–100
  platformShare?: number;
  prizePoolShare?: number;
  label?: string;
  title?: string;
  lines?: string[]; // optional override of tooltip body
  footnote?: string;
  className?: string;
}

/**
 * Universal disclosure pill shown next to any "spend" CTA.
 * Makes fee splits visible BEFORE the user pays — never after.
 */
export function FeeSplitBadge({
  artistShare = 0,
  platformShare = 0,
  prizePoolShare = 0,
  label,
  title = "Where your money goes",
  lines,
  footnote = "Always disclosed before you pay.",
  className,
}: FeeSplitBadgeProps) {
  const computedLines = lines ?? [
    artistShare > 0 ? `${artistShare}% to the artist` : null,
    prizePoolShare > 0 ? `${prizePoolShare}% to the prize pool` : null,
    platformShare > 0 ? `${platformShare}% platform fee` : null,
  ].filter(Boolean) as string[];

  const displayLabel = label ?? (artistShare > 0 ? `${artistShare}% to artist` : "Fee details");

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
            {displayLabel}
            <Info className="h-3 w-3 opacity-70" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          <p className="font-semibold mb-1">{title}</p>
          <ul className="space-y-0.5">
            {computedLines.map((l, i) => (
              <li key={i}>• {l}</li>
            ))}
          </ul>
          {footnote && <p className="mt-2 text-muted-foreground">{footnote}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

