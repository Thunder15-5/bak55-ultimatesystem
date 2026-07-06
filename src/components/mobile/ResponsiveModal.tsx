import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Dialog max width classes for desktop (default max-w-lg) */
  desktopMaxWidth?: string;
}

/**
 * Renders a Dialog on desktop and a mobile-first BottomSheet on phones.
 * Standardized headers, grabber, safe-area padding, and scrollable body
 * for every remaining modal in the app.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  className,
  desktopMaxWidth = "max-w-lg",
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {trigger ? <span onClick={() => onOpenChange(true)}>{trigger}</span> : null}
        <BottomSheet
          open={open}
          onOpenChange={onOpenChange}
          title={title}
          description={description}
          className={className}
        >
          <div className="px-4 pb-6">{children}</div>
        </BottomSheet>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn(desktopMaxWidth, "max-h-[90vh] overflow-y-auto", className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-title font-heading">{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
