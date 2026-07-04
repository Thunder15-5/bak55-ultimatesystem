/**
 * Tiny haptic helper — no-ops when unsupported.
 * Use for primary user actions (vote, tip, follow, submit).
 */
type Pattern = "light" | "medium" | "success" | "warning" | "error";

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 10,
  medium: 20,
  success: [15, 30, 40],
  warning: [30, 20, 30],
  error: [40, 30, 60],
};

export function haptic(pattern: Pattern = "light") {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    /* noop */
  }
}
