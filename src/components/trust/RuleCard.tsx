import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RuleItem {
  label: string;
  value: string;
  hint?: string;
}

interface RuleCardProps {
  title?: string;
  subtitle?: string;
  rules: RuleItem[];
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Universal "How this works" disclosure card.
 * Use on every page where rules, formulas, fees, or limits affect the user.
 */
export function RuleCard({ title = "How this works", subtitle, rules, defaultOpen = false, className }: RuleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("overflow-hidden border-primary/20 bg-card/60 backdrop-blur", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{title}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Transparent</Badge>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t">
          {rules.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.label}</p>
                {r.hint && <p className="text-xs text-muted-foreground mt-0.5">{r.hint}</p>}
              </div>
              <span className="text-sm font-semibold text-primary whitespace-nowrap">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
