import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Search, ShieldCheck, Users, Clock, ArrowRight, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageSEO } from "@/components/SEO";
import { COMPETITION_TYPES } from "@/lib/organizers";
import { format, differenceInDays } from "date-fns";

interface Row {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  prize_amount: number;
  entry_fee: number | null;
  status: string;
  country: string | null;
  genres: string[] | null;
  competition_type: string | null;
  registration_end: string | null;
  start_date: string;
  end_date: string;
  organizer_id: string | null;
  organizers: { id: string; name: string; slug: string; logo_url: string | null; verification: string } | null;
  submissions: { count: number }[];
}

export default function CompetitionMarketplace() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [genre, setGenre] = useState("all");
  const [type, setType] = useState("all");
  const [reg, setReg] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*, organizers(id, name, slug, logo_url, verification), submissions(count)")
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => [...new Set(rows.map((r) => r.country).filter(Boolean))] as string[], [rows]);
  const genres = useMemo(() => [...new Set(rows.flatMap((r) => r.genres ?? []))], [rows]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (q && !`${r.title} ${r.organizers?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (country !== "all" && r.country !== country) return false;
      if (genre !== "all" && !(r.genres ?? []).includes(genre)) return false;
      if (type !== "all" && (r.competition_type ?? "music") !== type) return false;
      if (reg === "open" && r.status !== "active") return false;
      if (reg === "closed" && r.status === "active") return false;
      return true;
    });
    if (sort === "prize") list = [...list].sort((a, b) => Number(b.prize_amount) - Number(a.prize_amount));
    if (sort === "closing") list = [...list].sort((a, b) => +new Date(a.end_date) - +new Date(b.end_date));
    return list;
  }, [rows, q, country, genre, type, reg, sort]);

  return (
    <>
      <PageSEO page="competition" />
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <main className="container mx-auto max-w-6xl px-4 pt-24 pb-24">
          <header className="space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
              <Trophy className="w-4 h-4" /> Competition marketplace
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold">
              Every competition on <span className="text-gradient">BAK55</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Hosted by studios, labels, brands, universities, festivals and producers. Enter as an artist or back your
              favourite contestant with a vote.
            </p>
            <div className="flex gap-2 flex-wrap pt-1">
              <Button variant="hero" size="sm" asChild><Link to="/organizer/setup">Host a competition</Link></Button>
              <Button variant="outline" size="sm" asChild><Link to="/organizers">Browse organizers</Link></Button>
            </div>
          </header>

          {/* Filters */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="h-12 pl-9" placeholder="Search competitions or organizers" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Genre" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {COMPETITION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={reg} onValueChange={setReg}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Registration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="open">Open for entries</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="prize">Biggest prize</SelectItem>
                  <SelectItem value="closing">Closing soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-14 text-center space-y-3">
                <Trophy className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="font-semibold">No competitions match those filters</p>
                <p className="text-sm text-muted-foreground">Try clearing a filter — or host the first one yourself.</p>
                <Button variant="hero" size="sm" asChild><Link to="/organizer/setup">Host a competition</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => {
                const days = differenceInDays(new Date(c.end_date), new Date());
                return (
                  <Link key={c.id} to={`/competition/${c.id}`}>
                    <Card className="group h-full overflow-hidden hover:border-primary/40 transition-all hover:-translate-y-0.5">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/10 relative">
                        {c.cover_image && <img src={c.cover_image} alt={`${c.title} banner`} loading="lazy" className="w-full h-full object-cover" />}
                        <Badge className="absolute top-2 left-2 bg-background/90 text-foreground border-0 capitalize">{c.status}</Badge>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold leading-tight line-clamp-2">{c.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">{c.organizers?.name ?? "BAK55 Talent"}</span>
                          {c.organizers?.verification === "verified" && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.submissions?.[0]?.count ?? 0} entries</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{days > 0 ? `${days}d left` : format(new Date(c.end_date), "d MMM")}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-sm font-bold text-primary">{Number(c.prize_amount).toLocaleString()} BAK</span>
                          <span className="text-xs font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
