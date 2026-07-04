import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

interface PressableButtonProps extends ButtonProps {
  hapticPattern?: "light" | "medium" | "success" | "warning" | "error";
}

/**
 * Button with press-scale feedback and haptic on tap.
 * Use for primary interactive actions (vote, tip, follow, submit).
 */
export const PressableButton = forwardRef<HTMLButtonElement, PressableButtonProps>(
  ({ className, onClick, hapticPattern = "light", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("press-scale", className)}
        onClick={(e) => {
          haptic(hapticPattern);
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
PressableButton.displayName = "PressableButton";
