import { checkPassword } from "@/lib/authRules";
import { Check, X } from "lucide-react";

interface Props {
  password: string;
  className?: string;
}

const BAR_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-yellow-500",
  "bg-emerald-500",
  "bg-emerald-400",
];

export function PasswordStrengthMeter({ password, className = "" }: Props) {
  if (!password) return null;
  const { score, label, issues, valid } = checkPassword(password);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? BAR_COLORS[score] : "bg-muted"
            }`}
          />
        ))}
        <span className="text-[11px] text-muted-foreground w-20 text-right">{label}</span>
      </div>

      {!valid && (
        <ul className="space-y-0.5">
          {issues.map((issue) => (
            <li key={issue} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <X className="w-3 h-3 text-destructive shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
      )}

      {valid && (
        <p className="text-[11px] text-emerald-500 flex items-center gap-1.5">
          <Check className="w-3 h-3" />
          Strong enough — you're good to go
        </p>
      )}
    </div>
  );
}
