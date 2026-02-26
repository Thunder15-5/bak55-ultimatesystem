import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error: Error): boolean {
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    error.name === 'ChunkLoadError'
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    
    // Auto-reload on chunk loading errors (common in in-app browsers)
    if (isChunkLoadError(error)) {
      const reloadKey = 'chunk_reload_' + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      
      // Only auto-reload once per path per 30 seconds
      if (!lastReload || now - parseInt(lastReload) > 30000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
        return;
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isChunkError = this.state.error && isChunkLoadError(this.state.error);

      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-bold">
                {isChunkError ? "Connection issue" : "Something went wrong"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isChunkError 
                  ? "The page couldn't load properly. Please tap reload to try again."
                  : "This page encountered an error. Try refreshing or go back to the homepage."}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={isChunkError ? this.handleReload : this.handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {isChunkError ? "Reload" : "Try Again"}
              </Button>
              <Button variant="default" onClick={() => window.location.href = "/"}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
