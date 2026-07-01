import { CheckCircle2, Loader2, Phone, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaymentStatus = "prompting" | "pending" | "success" | "failed";

interface PaymentStatusScreenProps {
  status: PaymentStatus;
  amount: number;
  currency?: string;
  phone?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onDone?: () => void;
}

/**
 * Mobile-first live status screen for M-Pesa STK / gateway payments.
 * Drop into a Dialog/Sheet — no chrome of its own.
 */
export function PaymentStatusScreen({
  status,
  amount,
  currency = "KES",
  phone,
  errorMessage,
  onRetry,
  onDone,
}: PaymentStatusScreenProps) {
  const config = {
    prompting: {
      icon: Phone,
      title: "Check your phone",
      body: `Enter your M-Pesa PIN to confirm ${currency} ${amount.toLocaleString()}.`,
      tone: "text-primary",
      ring: "ring-primary/30",
      spin: false,
    },
    pending: {
      icon: Loader2,
      title: "Confirming payment…",
      body: "This usually takes 5–15 seconds. Don't close this screen.",
      tone: "text-primary",
      ring: "ring-primary/30",
      spin: true,
    },
    success: {
      icon: CheckCircle2,
      title: "Payment received",
      body: `${currency} ${amount.toLocaleString()} confirmed. Your BAKCoins are ready.`,
      tone: "text-success",
      ring: "ring-success/30",
      spin: false,
    },
    failed: {
      icon: XCircle,
      title: "Payment didn't go through",
      body: errorMessage || "The transaction was cancelled or timed out. You can try again.",
      tone: "text-destructive",
      ring: "ring-destructive/30",
      spin: false,
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center text-center px-6 py-8 space-y-6">
      <div
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center ring-8",
          config.ring,
          "bg-card"
        )}
      >
        <Icon
          className={cn("w-12 h-12", config.tone, config.spin && "animate-spin")}
        />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h2 className="text-xl font-heading font-bold">{config.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{config.body}</p>
        {phone && status !== "success" && status !== "failed" && (
          <p className="text-xs text-muted-foreground pt-2">
            Prompt sent to <span className="text-foreground font-medium">{phone}</span>
          </p>
        )}
      </div>

      {status === "success" && (
        <Button size="lg" className="w-full h-12 text-base font-semibold" onClick={onDone}>
          Continue
        </Button>
      )}

      {status === "failed" && (
        <div className="w-full space-y-2">
          <Button size="lg" className="w-full h-12 text-base font-semibold" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try again
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDone}>
            Close
          </Button>
        </div>
      )}

      {(status === "prompting" || status === "pending") && (
        <p className="text-[11px] text-muted-foreground">
          Secure payment · Safaricom M-Pesa
        </p>
      )}
    </div>
  );
}
