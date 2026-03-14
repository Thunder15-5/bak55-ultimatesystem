import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface DashboardHeaderProps {
  greeting: string;
  username: string;
  subtitle: string;
  actions?: Array<{
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "outline" | "hero" | "secondary";
  }>;
}

export function DashboardHeader({ greeting, username, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">{greeting}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
          Hey, <span className="text-gradient">{username}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex gap-2 flex-shrink-0">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Button key={i} variant={(action.variant as any) || "outline"} size="sm" onClick={action.onClick}>
                {Icon && <Icon className="h-4 w-4 mr-1.5" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
