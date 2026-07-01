import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface StickyMobileCTAProps {
  /** Primary action label */
  label: string;
  /** Where the primary action navigates. Ignored when onClick is provided. */
  to?: string;
  /** Optional onClick handler (takes precedence over `to`) */
  onClick?: () => void;
  /** Optional secondary link (small text link) */
  secondary?: { label: string; to: string };
  /** Show only after user scrolls this many pixels. Default 320. */
  showAfter?: number;
  /** Hide entirely if this is true (e.g., user already signed in). */
  hidden?: boolean;
  /** Optional short hint text above the button */
  hint?: string;
}

/**
 * Bottom-anchored, mobile-only, thumb-friendly CTA bar for public/landing pages.
 * Appears after the user scrolls past the fold; safe-area aware.
 */
export function StickyMobileCTA({
  label,
  to,
  onClick,
  secondary,
  showAfter = 320,
  hidden = false,
  hint,
}: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hidden) return;
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter, hidden]);

  if (hidden) return null;

  const button = (
    <Button
      size="lg"
      variant="hero"
      className="w-full h-14 text-base font-semibold rounded-xl shadow-lg"
      onClick={onClick}
    >
      {label}
      <ArrowRight className="ml-2 w-4 h-4" />
    </Button>
  );

  return (
    <div
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 pointer-events-none",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto bg-background/95 backdrop-blur-xl border-t border-border/60 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.25)]">
        {hint && (
          <p className="text-[11px] text-muted-foreground text-center mb-2">{hint}</p>
        )}
        {onClick || !to ? button : <Link to={to}>{button}</Link>}
        {secondary && (
          <Link
            to={secondary.to}
            className="block text-center text-xs text-muted-foreground mt-2 hover:text-foreground"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
