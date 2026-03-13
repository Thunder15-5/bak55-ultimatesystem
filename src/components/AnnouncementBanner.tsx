import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Megaphone, Sparkles, AlertTriangle, Info } from "lucide-react";

const iconMap: Record<string, any> = {
  info: Info,
  feature: Sparkles,
  update: Megaphone,
  maintenance: AlertTriangle,
};

const colorMap: Record<string, string> = {
  info: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 text-blue-300",
  feature: "from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent border-[#D4AF37]/20 text-[#D4AF37]",
  update: "from-green-500/10 via-green-500/5 to-transparent border-green-500/20 text-green-300",
  maintenance: "from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 text-orange-300",
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ["platform-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: dismissals = [] } = useQuery({
    queryKey: ["announcement-dismissals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("announcement_dismissals")
        .select("announcement_id")
        .eq("user_id", user.id);
      return data?.map((d: any) => d.announcement_id) || [];
    },
    enabled: !!user,
  });

  // Listen for realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_announcements" }, () => {
        queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const visible = announcements.filter((a: any) => !dismissals.includes(a.id));

  const dismiss = async (id: string) => {
    if (user) {
      await supabase.from("announcement_dismissals").insert({ user_id: user.id, announcement_id: id });
      queryClient.invalidateQueries({ queryKey: ["announcement-dismissals"] });
    }
  };

  if (visible.length === 0) return null;

  return (
    <div className="space-y-1 px-4 pt-2">
      {visible.slice(0, 2).map((a: any) => {
        const Icon = iconMap[a.type] || Info;
        const colors = colorMap[a.type] || colorMap.info;
        return (
          <div key={a.id} className={`relative bg-gradient-to-r ${colors} border rounded-lg px-4 py-2.5 flex items-start gap-3 text-sm`}>
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold mr-1.5">{a.title}</span>
              <span className="opacity-80">{a.message}</span>
            </div>
            <button onClick={() => dismiss(a.id)} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
