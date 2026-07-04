import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PressableButton } from "@/components/PressableButton";

interface RetryableErrorProps {
  title?: string;
  description?: string;
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
}

/**
 * Standard retryable failure state — use in place of ad-hoc error UIs.
 * Pair with skeletons during loading and EmptyState when data is empty.
 */
export function RetryableError({
  title = "Something went wrong",
  description = "We couldn't load this right now. Check your connection and try again.",
  onRetry,
  retrying = false,
}: RetryableErrorProps) {
  return (
    <Card className="card-base">
      <CardContent className="py-10 text-center flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-title">{title}</h3>
          <p className="text-body">{description}</p>
        </div>
        <PressableButton
          onClick={() => onRetry()}
          disabled={retrying}
          hapticPattern="medium"
          className="min-w-[140px]"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying…" : "Try again"}
        </PressableButton>
      </CardContent>
    </Card>
  );
}
