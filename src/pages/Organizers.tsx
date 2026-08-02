import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ShieldCheck, Search, Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ORGANIZER_TYPES, organizerTypeLabel } from "@/lib/organizers";

export default function Organizers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("organizers")
        .select("*")
        .eq("verification", "verified")
        .order("featured", { ascending: false })
        .order("total_competitions", { ascending: false })
        .limit(100);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (o) =>
          (type === "all" || o.organizer_type === type) &&
          (!q || `${o.name} ${o.city ?? ""} ${o.country ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [rows, q, type]
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 pt-24 pb-24">
        <header className="space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Organizers
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold">
            The organizations <span className="text-gradient">building talent</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Studios, labels, brands, universities, NGOs, agencies and festivals running competitions on BAK55.
          </p>
        </header>

        <div className="grid sm:grid-cols-[1fr_220px] gap-2 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="h-12 pl-9" placeholder="Search organizers" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-12"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ORGANIZER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-14 text-center space-y-3">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="font-semibold">No verified organizers yet</p>
              <p className="text-sm text-muted-foreground">Be the first organization to host competitions on BAK55.</p>
              <Button variant="hero" size="sm" asChild><Link to="/organizer/setup">Become an organizer</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((o) => (
              <Link key={o.id} to={`/organizer/${o.slug}`}>
                <Card className="group h-full hover:border-primary/40 transition-all hover:-translate-y-0.5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                        {o.logo_url ? <img src={o.logo_url} alt={`${o.name} logo`} loading="lazy" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-primary-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold truncate">{o.name}</h3>
                          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground">{organizerTypeLabel(o.organizer_type)}</p>
                      </div>
                    </div>
                    {o.description && <p className="text-xs text-muted-foreground line-clamp-2">{o.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      <Badge variant="outline" className="gap-1"><Trophy className="w-3 h-3" />{o.total_competitions} competitions</Badge>
                      <span className="inline-flex items-center gap-1 font-medium group-hover:gap-2 transition-all">View <ArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
