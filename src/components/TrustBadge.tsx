import { Shield, Lock } from "lucide-react";

interface TrustBadgeProps {
  variant?: "inline" | "card";
  text?: string;
}

export function TrustBadge({ variant = "inline", text = "Secure & transparent" }: TrustBadgeProps) {
  if (variant === "card") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
        <Shield className="w-4 h-4 text-success flex-shrink-0" />
        <span className="text-xs text-muted-foreground">{text}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}
