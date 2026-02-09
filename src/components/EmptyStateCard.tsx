import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionLink: string;
  variant?: "default" | "gradient";
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  variant = "default",
}: EmptyStateCardProps) {
  return (
    <Card className={`border-dashed border-2 ${variant === "gradient" ? "border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5" : "border-muted-foreground/20"}`}>
      <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${variant === "gradient" ? "bg-gradient-to-br from-primary to-secondary" : "bg-muted"}`}>
          <Icon className={`w-7 h-7 ${variant === "gradient" ? "text-white" : "text-muted-foreground"}`} />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
        </div>
        <Link to={actionLink}>
          <Button variant={variant === "gradient" ? "hero" : "outline"} size="sm">
            {actionLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
