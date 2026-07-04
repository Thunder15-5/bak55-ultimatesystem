import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Max viewport height percentage (default 92) */
  maxVh?: number;
}

/**
 * Mobile-first bottom sheet — replaces Dialog on phones.
 * Includes grabber handle (from vaul), safe-area padding, and scrollable body.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxVh = 92,
}: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "rounded-t-2xl border-t border-border/60 bg-background/95 backdrop-blur-xl pb-safe",
          className
        )}
        style={{ maxHeight: `${maxVh}vh` }}
      >
        {(title || description) && (
          <DrawerHeader className="px-5 pt-2 pb-3 text-left">
            {title && (
              <DrawerTitle className="text-title font-heading">{title}</DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-sm text-muted-foreground">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        )}
        <div className="overflow-y-auto px-1">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
