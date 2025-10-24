import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Music, Users, Trophy } from "lucide-react";

interface Stats {
  tracks: number;
  artists: number;
  activeCompetitions: number;
}

export const StatsBar = () => {
  const [stats, setStats] = useState<Stats>({ tracks: 0, artists: 0, activeCompetitions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const nowIso = new Date().toISOString();
        const [{ count: trackCount }, { count: artistCount }, { count: compCount }] = await Promise.all([
          supabase.from('tracks').select('*', { count: 'exact', head: true }),
          supabase.from('artist_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('competitions').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('end_date', nowIso),
        ]);
        if (!isMounted) return;
        setStats({
          tracks: trackCount || 0,
          artists: artistCount || 0,
          activeCompetitions: compCount || 0,
        });
      } catch (e) {
        // Silent fail to avoid UX break; values remain 0
        console.error('StatsBar load error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="px-4 py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Live Platform Metrics
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Our <span className="text-gradient">Growing Community</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time statistics from our platform. Join our founding artists today!
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* Tracks */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tracks Uploaded</div>
                {loading ? (
                  <div className="h-8 w-24 bg-muted/40 rounded animate-pulse mt-1" />
                ) : (
                  <div className="text-3xl font-bold">{stats.tracks.toLocaleString()}</div>
                )}
              </div>
            </div>
          </Card>

          {/* Artists */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Artists</div>
                {loading ? (
                  <div className="h-8 w-20 bg-muted/40 rounded animate-pulse mt-1" />
                ) : (
                  <div className="text-3xl font-bold">{stats.artists.toLocaleString()}</div>
                )}
              </div>
            </div>
          </Card>

          {/* Active competitions */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-accent/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Competitions</div>
                {loading ? (
                  <div className="h-8 w-16 bg-muted/40 rounded animate-pulse mt-1" />
                ) : (
                  <div className="text-3xl font-bold">{stats.activeCompetitions.toLocaleString()}</div>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Early Access Message */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            🚀 <span className="font-semibold text-primary">Early Access Phase</span> · Be among the first 100 artists
          </p>
        </div>
      </div>
    </section>
  );
};
