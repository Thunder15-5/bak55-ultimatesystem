import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  link: string;
  variant?: "default" | "outline" | "hero" | "secondary";
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4 | 5;
}

export function QuickActions({ actions, columns = 4 }: QuickActionsProps) {
  const navigate = useNavigate();
  const gridCols: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-2 sm:gap-3 ${gridCols[columns]}`}>
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Button
                key={i}
                variant={(action.variant as any) || "outline"}
                onClick={() => navigate(action.link)}
                className="h-auto py-3 flex-col gap-1.5 text-xs sm:text-sm"
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate w-full text-center">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
