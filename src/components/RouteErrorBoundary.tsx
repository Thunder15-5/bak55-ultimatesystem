import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Lightweight wrapper that gives each route its own ErrorBoundary
 * so a crash in one page doesn't tear down the entire app shell
 * (music player, bottom nav, etc. stay alive).
 */
export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);
