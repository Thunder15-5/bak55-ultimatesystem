import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { permissionState, isSupported, enableNotifications, loading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !isSupported || permissionState === "granted" || permissionState === "denied") return;

    const dismissedAt = localStorage.getItem("push_prompt_dismissed");
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Show after a short delay
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [user, isSupported, permissionState]);

  if (!visible || dismissed || !user || permissionState === "granted") return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("push_prompt_dismissed", Date.now().toString());
  };

  const handleEnable = async () => {
    await enableNotifications();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4">
      <Card className="border-primary/30 bg-card/95 backdrop-blur-md shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/20 p-2 shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Stay in the loop 🔔</p>
              <p className="text-xs text-muted-foreground mt-1">
                Get notified about new tracks, competition results, and tips from fans.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleEnable} disabled={loading} className="text-xs">
                  {loading ? "Enabling..." : "Enable"}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs">
                  Later
                </Button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
