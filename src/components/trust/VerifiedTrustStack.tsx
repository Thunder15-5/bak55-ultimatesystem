import { CheckCircle2, ShieldCheck, BadgeCheck, Music, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedTrustStackProps {
  identityVerified?: boolean;
  kycComplete?: boolean;
  rightsAttested?: boolean;
  activeSince?: string | Date;
  className?: string;
}

/**
 * Compact identity & trust stack for artist profiles.
 * Each badge has a tooltip explaining what it means.
 */
export function VerifiedTrustStack({
  identityVerified,
  kycComplete,
  rightsAttested,
  activeSince,
  className,
}: VerifiedTrustStackProps) {
  const items = [
    {
      ok: identityVerified,
      icon: BadgeCheck,
      label: "Identity Verified",
      tip: "Confirmed via government-issued ID and selfie match.",
    },
    {
      ok: kycComplete,
      icon: ShieldCheck,
      label: "KYC Complete",
      tip: "Required to receive payouts. Confirms real-world identity.",
    },
    {
      ok: rightsAttested,
      icon: Music,
      label: "Owns This Music",
      tip: "Artist legally attested to owning the rights to uploaded tracks.",
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Tooltip key={it.label}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-help",
                    it.ok
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/50 border-border text-muted-foreground"
                  )}
                >
                  {it.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5 opacity-60" />}
                  <span>{it.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{it.tip}</p>
                {!it.ok && <p className="text-xs text-muted-foreground mt-1">Not yet verified.</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {activeSince && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-muted/30 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Active since {new Date(activeSince).getFullYear()}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
