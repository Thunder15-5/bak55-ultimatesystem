/**
 * Single source of truth for BAK55 auth rules:
 * redirect URLs, password policy, and human-readable auth error copy.
 */

/** Always redirect back to the origin the user actually started on. */
export function authRedirectUrl(path = "/auth/callback"): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirectPath(value?: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  valid: boolean;
  issues: string[];
}

export function checkPassword(password: string): PasswordStrength {
  const issues: string[] = [];
  const pw = password ?? "";

  if (pw.length < MIN_PASSWORD_LENGTH) {
    issues.push(`At least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) {
    issues.push("Upper and lowercase letters");
  }
  if (!/\d/.test(pw)) {
    issues.push("At least one number");
  }

  const common = ["password", "12345678", "qwerty", "bak55", "letmein", "iloveyou"];
  if (common.some((c) => pw.toLowerCase().includes(c))) {
    issues.push("Avoid common words like \"password\"");
  }

  let score = 0;
  if (pw.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) score++;

  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  return {
    score: score as PasswordStrength["score"],
    label: labels[score],
    valid: issues.length === 0,
    issues,
  };
}

/** Map any Supabase auth error to copy a real person can act on. */
export function authErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = (error as { message?: string })?.message ?? "";
  const msg = raw.toLowerCase();

  if (!raw) return fallback;
  if (msg.includes("invalid login credentials"))
    return "Wrong email or password. If you just signed up, verify your email first.";
  if (msg.includes("email not confirmed"))
    return "Verify your email before logging in — check your inbox for the confirmation link.";
  if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate"))
    return "That email is already registered. Log in instead.";
  if (msg.includes("rate") || msg.includes("too many"))
    return "Too many attempts. Wait a couple of minutes and try again.";
  if (msg.includes("provider is not enabled"))
    return "Google sign-in isn't available right now. Use email instead.";
  if (msg.includes("popup") || msg.includes("closed"))
    return "The sign-in window closed before finishing. Try again.";
  if (msg.includes("expired") || msg.includes("invalid token"))
    return "That link has expired. Request a fresh one.";
  if (msg.includes("weak") || msg.includes("password should"))
    return `Password is too weak. Use ${MIN_PASSWORD_LENGTH}+ characters with upper, lower and a number.`;
  if (msg.includes("network") || msg.includes("fetch"))
    return "Connection problem. Check your internet and try again.";
  if (msg.includes("user not found"))
    return "No account found with that email.";
  if (msg.includes("same password") || msg.includes("should be different"))
    return "Your new password must be different from your current one.";

  return raw || fallback;
}

/** Role → landing route, in priority order. */
export const ROLE_PRIORITY = ["admin", "brand", "producer", "artist", "fan"] as const;

export function primaryRoleOf(roles: string[]): string | null {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
}

export function dashboardPathFor(role: string | null): string {
  if (!role) return "/onboarding";
  if (role === "admin") return "/admin";
  return `/${role}/dashboard`;
}
