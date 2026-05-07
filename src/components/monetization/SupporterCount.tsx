import { useEffect, useState } from "react";
import { Heart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SupporterCountProps {
  artistId: string;
  className?: string;
}

/**
 * Public-safe support signal.
 * Shows COUNT of supporters — never amounts. Protects artist revenue privacy.
 */
export function SupporterCount({ artistId, className }: SupporterCountProps) {
  const [tipperCount, setTipperCount] = useState<number | null>(null);
  const [voterCount, setVoterCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ count: tippers }, { count: voters }] = await Promise.all([
        supabase
          .from("tips")
          .select("from_user_id", { count: "exact", head: true })
          .eq("to_artist_id", artistId),
        supabase
          .from("votes")
          .select("voter_id, submissions!inner(artist_id)", { count: "exact", head: true })
          .eq("submissions.artist_id", artistId),
      ]);
      if (cancelled) return;
      setTipperCount(tippers ?? 0);
      setVoterCount(voters ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [artistId]);

  if (tipperCount === null && voterCount === null) return null;

  const total = (tipperCount ?? 0) + (voterCount ?? 0);
  if (total === 0) return null;

  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      {voterCount! > 0 && (
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">{voterCount!.toLocaleString()}</span> backers
        </span>
      )}
      {tipperCount! > 0 && (
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
          <span className="font-semibold text-foreground">{tipperCount!.toLocaleString()}</span> supporters
        </span>
      )}
    </div>
  );
}
