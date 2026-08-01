import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  artists: number;
  tracks: number;
  competitions: number;
}

/**
 * Live counts pulled straight from the database.
 * Nothing here is hardcoded — if a number is zero, we show zero.
 */
export function LiveStatsRow({ className = "" }: { className?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    supabase.rpc("get_public_platform_stats").then(({ data }) => {
      if (!active || !data || typeof data !== "object" || Array.isArray(data)) return;
      const d = data as Record<string, unknown>;
      setStats({
        artists: Number(d.artists_count) || 0,
        tracks: Number(d.tracks_count) || 0,
        competitions: Number(d.competitions_count) || 0,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const items = [
    { label: "Artists registered", value: stats?.artists },
    { label: "Tracks published", value: stats?.tracks },
    { label: "Active competitions", value: stats?.competitions },
  ];

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="text-center">
          {stats === null ? (
            <Skeleton className="mx-auto mb-2 h-8 w-14" />
          ) : (
            <p className="text-2xl font-bold text-gradient md:text-3xl">{item.value}</p>
          )}
          <p className="text-xs text-muted-foreground md:text-sm">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
