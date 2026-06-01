import { Lock } from "lucide-react";

export function RevenuePrivacyBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5 text-primary" />
      <span>
        <span className="font-medium text-foreground">Private dashboard.</span>{" "}
        Earnings are visible only to you. Public profiles show supporter counts, never amounts.
      </span>
    </div>
  );
}
