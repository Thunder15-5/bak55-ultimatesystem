import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  icon: LucideIcon;
  label: string;
  to?: string;
  onClick?: () => void;
  /** Extra offset from bottom to clear bottom navigation. Default 80px. */
  bottomOffset?: number;
}

/**
 * Floating Action Button — mobile only, sits above the bottom nav.
 * Use for the single most important role-based action (Upload, Vote, etc.).
 */
export function MobileFAB({ icon: Icon, label, to, onClick, bottomOffset = 80 }: MobileFABProps) {
  const body = (
    <div
      className={cn(
        "flex items-center gap-2 px-5 h-14 rounded-full",
        "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground",
        "shadow-2xl shadow-primary/40 active:scale-95 transition-transform"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
    </div>
  );

  return (
    <div
      className="md:hidden fixed right-4 z-40 pb-[env(safe-area-inset-bottom)]"
      style={{ bottom: bottomOffset }}
    >
      {onClick || !to ? (
        <button onClick={onClick} aria-label={label}>{body}</button>
      ) : (
        <Link to={to} aria-label={label}>{body}</Link>
      )}
    </div>
  );
}
