import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ShieldCheck, Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { organizerTypeLabel } from "@/lib/organizers";

export function VerifiedOrganizers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("organizers")
      .select("id, name, slug, logo_url, organizer_type, total_competitions")
      .eq("verification", "verified")
      .order("featured", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  if (!loading && rows.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold">Verified organizers</h2>
            <p className="text-sm text-muted-foreground">Organizations hosting competitions on BAK55 right now.</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
            <Link to="/organizers">All <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rows.map((o) => (
              <Link key={o.id} to={`/organizer/${o.slug}`}>
                <Card className="group h-full hover:border-primary/40 transition-all">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                      {o.logo_url ? <img src={o.logo_url} alt={`${o.name} logo`} loading="lazy" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm truncate">{o.name}</p>
                        <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {organizerTypeLabel(o.organizer_type)} · <Trophy className="w-3 h-3 inline" /> {o.total_competitions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
