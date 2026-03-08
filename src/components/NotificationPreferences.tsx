import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bell, UserPlus, Coins, Trophy, MessageCircle, Music, Megaphone, Loader2 } from "lucide-react";

interface Preferences {
  follows: boolean;
  tips: boolean;
  competitions: boolean;
  messages: boolean;
  track_updates: boolean;
  marketing: boolean;
}

const defaultPrefs: Preferences = {
  follows: true,
  tips: true,
  competitions: true,
  messages: true,
  track_updates: true,
  marketing: false,
};

export function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPrefs({
          follows: data.follows ?? true,
          tips: data.tips ?? true,
          competitions: data.competitions ?? true,
          messages: data.messages ?? true,
          track_updates: data.track_updates ?? true,
          marketing: data.marketing ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Notification preferences saved!");
    } catch (error: any) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: keyof Preferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = [
    { key: "follows" as const, label: "New Followers", desc: "When someone follows you", icon: UserPlus, color: "text-blue-500" },
    { key: "tips" as const, label: "Tips Received", desc: "When you receive BAKCoins tips", icon: Coins, color: "text-yellow-500" },
    { key: "competitions" as const, label: "Competitions", desc: "Updates, results, and new competitions", icon: Trophy, color: "text-amber-500" },
    { key: "messages" as const, label: "Messages", desc: "New direct messages", icon: MessageCircle, color: "text-green-500" },
    { key: "track_updates" as const, label: "Track Updates", desc: "Moderation status, comments, plays milestones", icon: Music, color: "text-purple-500" },
    { key: "marketing" as const, label: "Marketing & News", desc: "Platform updates, features, and promotions", icon: Megaphone, color: "text-muted-foreground" },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(({ key, label, desc, icon: Icon, color }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <Label htmlFor={key} className="font-medium cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Switch
              id={key}
              checked={prefs[key]}
              onCheckedChange={() => togglePref(key)}
            />
          </div>
        ))}

        <Button onClick={savePreferences} disabled={saving} className="w-full mt-4">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
