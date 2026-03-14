import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; direction: "up" | "down" };
  link?: string;
  loading?: boolean;
  variant?: "default" | "primary" | "secondary" | "accent" | "success" | "warning" | "destructive";
}

const variantStyles: Record<string, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const variantBg: Record<string, string> = {
  default: "bg-muted/50",
  primary: "bg-primary/10",
  secondary: "bg-secondary/10",
  accent: "bg-accent/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
};

export function StatsCard({ icon: Icon, label, value, subtitle, trend, link, loading, variant = "default" }: StatsCardProps) {
  const content = (
    <Card className={cn(
      "group relative overflow-hidden border-border/50 transition-all duration-300",
      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
      link && "cursor-pointer hover:-translate-y-0.5"
    )}>
      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <div className={cn("p-2 rounded-lg transition-transform duration-300 group-hover:scale-110", variantBg[variant])}>
                <Icon className={cn("h-4 w-4", variantStyles[variant])} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <div className="flex items-center gap-2">
                {trend && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    trend.direction === "up" ? "text-success" : "text-destructive"
                  )}>
                    {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.value}
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }
  return content;
}
