import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface Phase {
  id: string;
  label: string;
  status: "completed" | "active" | "upcoming";
}

interface CompetitionPhaseTimelineProps {
  phases?: Phase[];
  currentPhase?: string;
}

const defaultPhases: Phase[] = [
  { id: "submissions", label: "Submissions", status: "upcoming" },
  { id: "review", label: "Review", status: "upcoming" },
  { id: "voting", label: "Voting", status: "upcoming" },
  { id: "finals", label: "Finals", status: "upcoming" },
  { id: "winners", label: "Winners", status: "upcoming" },
];

export function CompetitionPhaseTimeline({ phases, currentPhase }: CompetitionPhaseTimelineProps) {
  const displayPhases = phases || defaultPhases.map(p => ({
    ...p,
    status: currentPhase === p.id ? "active" as const :
      defaultPhases.findIndex(dp => dp.id === currentPhase) > defaultPhases.findIndex(dp => dp.id === p.id)
        ? "completed" as const : "upcoming" as const,
  }));

  return (
    <div className="w-full">
      {/* Mobile: vertical */}
      <div className="sm:hidden space-y-0">
        {displayPhases.map((phase, i) => (
          <div key={phase.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                phase.status === "completed" && "bg-primary border-primary text-primary-foreground",
                phase.status === "active" && "border-primary bg-primary/10 text-primary",
                phase.status === "upcoming" && "border-muted-foreground/30 text-muted-foreground/30",
              )}>
                {phase.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : phase.status === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              {i < displayPhases.length - 1 && (
                <div className={cn(
                  "w-0.5 h-6",
                  phase.status === "completed" ? "bg-primary" : "bg-muted-foreground/20"
                )} />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium pt-1",
              phase.status === "active" && "text-primary font-semibold",
              phase.status === "upcoming" && "text-muted-foreground/50",
            )}>
              {phase.label}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        {displayPhases.map((phase, i) => (
          <div key={phase.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                phase.status === "completed" && "bg-primary border-primary text-primary-foreground",
                phase.status === "active" && "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",
                phase.status === "upcoming" && "border-muted-foreground/30 text-muted-foreground/30",
              )}>
                {phase.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : phase.status === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium whitespace-nowrap",
                phase.status === "active" && "text-primary font-semibold",
                phase.status === "upcoming" && "text-muted-foreground/50",
              )}>
                {phase.label}
              </span>
            </div>
            {i < displayPhases.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-2 mt-[-1rem]",
                phase.status === "completed" ? "bg-primary" : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
