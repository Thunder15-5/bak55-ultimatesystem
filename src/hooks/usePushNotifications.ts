import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { requestNotificationPermission, setupForegroundListener } from "@/lib/firebase";
import { toast } from "sonner";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }
    setPermissionState(Notification.permission);
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("FCM SW registered:", reg.scope))
        .catch((err) => console.error("FCM SW registration failed:", err));
    }
  }, []);

  // Set up foreground listener
  useEffect(() => {
    if (!user) return;

    setupForegroundListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || "New Notification";
      const body = payload.notification?.body || payload.data?.body || "";
      toast(title, { description: body });
    });
  }, [user]);

  const enableNotifications = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to enable notifications");
      return null;
    }

    setLoading(true);
    try {
      const token = await requestNotificationPermission();

      if (!token) {
        setPermissionState(Notification.permission);
        if (Notification.permission === "denied") {
          toast.error("Notifications blocked. Please enable them in your browser settings.");
        }
        return null;
      }

      setFcmToken(token);
      setPermissionState("granted");

      // Detect platform
      const isCapacitor = !!(window as any).Capacitor;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      let platform = "web";
      if (isCapacitor && isIOS) platform = "ios";
      else if (isCapacitor && isAndroid) platform = "android";

      // Save token to database
      const { error } = await supabase.from("push_tokens").upsert(
        {
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token" }
      );

      if (error) {
        console.error("Error saving push token:", error);
        // Try insert if upsert fails due to missing unique constraint
        await supabase.from("push_tokens").insert({
          user_id: user.id,
          token,
          platform,
        });
      }

      toast.success("Push notifications enabled! 🔔");
      return token;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    permissionState,
    fcmToken,
    loading,
    enableNotifications,
    isSupported: permissionState !== "unsupported",
  };
}
