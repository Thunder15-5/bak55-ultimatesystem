import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import {
  Loader2, Plus, Trophy, Users, Vote, Wallet, Building2, ShieldCheck,
  Pencil, Pause, Play, Settings2, BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizer } from "@/hooks/useOrganizer";
import { organizerTypeLabel } from "@/lib/organizers";
import { toast } from "sonner";
import { format } from "date-fns";

interface Comp {
  id: string;
  title: string;
  status: string;
  prize_amount: number;
  entry_fee: number | null;
  start_date: string;
  end_date: string;
  cover_image: string | null;
  submissions: { count: number }[];
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  voting: "bg-secondary/15 text-secondary",
  completed: "bg-accent/15 text-accent",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function OrganizerDashboard() {
  const { organizer, loading } = useOrganizer();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Comp[]>([]);
  const [loadingComps, setLoadingComps] = useState(true);
  const [revenue, setRevenue] = useState({ votes: 0, contestants: 0 });

  useEffect(() => {
    if (!organizer) {
      if (!loading) setLoadingComps(false);
      return;
    }
    (async () => {
      setLoadingComps(true);
      const { data } = await supabase
        .from("competitions")
        .select("id, title, status, prize_amount, entry_fee, start_date, end_date, cover_image, submissions(count)")
        .eq("organizer_id", organizer.id)
        .order("created_at", { ascending: false });
      const list = (data as any as Comp[]) ?? [];
      setComps(list);

      if (list.length) {
        const ids = list.map((c) => c.id);
        const [{ data: subs }, { count: voteCount }] = await Promise.all([
          supabase.from("submissions").select("id").in("competition_id", ids),
          supabase
            .from("votes")
            .select("id, submissions!inner(competition_id)", { count: "exact", head: true })
            .in("submissions.competition_id", ids),
        ]);
        setRevenue({ votes: voteCount ?? 0, contestants: subs?.length ?? 0 });
      }
      setLoadingComps(false);
    })();
  }, [organizer, loading]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("competitions").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    setComps((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(status === "active" ? "Competition resumed" : status === "draft" ? "Competition paused" : "Competition updated");
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <main className="container mx-auto max-w-2xl px-4 pt-28 pb-24">
          <EmptyStateCard
            icon={Building2}
            title="Create your organizer account"
            description="Studios, labels, brands, universities and event organizers host competitions on BAK55 with their own branding and revenue share."
            actionLabel="Get started"
            actionLink="/organizer/setup"
            variant="gradient"
          />
        </main>
        <Footer />
      </div>
    );
  }

  const live = comps.filter((c) => c.status === "active" || c.status === "voting");
  const drafts = comps.filter((c) => c.status === "draft");
  const ended = comps.filter((c) => c.status === "completed" || c.status === "cancelled");
  const totalPrize = comps.reduce((s, c) => s + Number(c.prize_amount || 0), 0);

  const stats = [
    { label: "Competitions", value: comps.length, icon: Trophy },
    { label: "Contestants", value: revenue.contestants, icon: Users },
    { label: "Votes cast", value: revenue.votes, icon: Vote },
    { label: "Prize pool (BAK)", value: totalPrize.toLocaleString(), icon: Wallet },
  ];

  const CompRow = ({ c }: { c: Comp }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{c.title}</h3>
            <Badge className={`${statusStyles[c.status] ?? "bg-muted"} border-0 capitalize`}>{c.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(c.start_date), "d MMM yyyy")} – {format(new Date(c.end_date), "d MMM yyyy")} ·{" "}
            {c.submissions?.[0]?.count ?? 0} entries · {Number(c.prize_amount).toLocaleString()} BAK prize
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => navigate(`/organizer/competitions/${c.id}/manage`)}>
            <Settings2 className="w-4 h-4 mr-1.5" /> Manage
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/organizer/competitions/${c.id}/edit`)}>
            <Pencil className="w-4 h-4 mr-1.5" /> Edit
          </Button>
          {c.status === "active" ? (
            <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "draft")}>
              <Pause className="w-4 h-4 mr-1.5" /> Pause
            </Button>
          ) : c.status === "draft" ? (
            <Button size="sm" variant="hero" onClick={() => setStatus(c.id, "active")} disabled={organizer.verification !== "verified"}>
              <Play className="w-4 h-4 mr-1.5" /> Publish
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 pt-24 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {organizer.logo_url ? (
                <img src={organizer.logo_url} alt={`${organizer.name} logo`} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-primary-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold truncate">{organizer.name}</h1>
                {organizer.verification === "verified" && <ShieldCheck className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {organizerTypeLabel(organizer.organizer_type)}
                {organizer.city ? ` · ${organizer.city}` : ""}
                {organizer.verification !== "verified" ? " · Verification pending" : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/organizer/setup")}>Edit profile</Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/organizer/competitions/new")}>
              <Plus className="w-4 h-4 mr-1.5" /> New competition
            </Button>
          </div>
        </div>

        {organizer.verification !== "verified" && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Your organization is awaiting verification. You can build competitions and save them as drafts —
                publishing unlocks once the BAK55 team verifies you.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 space-y-1">
                <s.icon className="w-4 h-4 text-primary" />
                <div className="text-2xl font-heading font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="live">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
            <TabsTrigger value="ended">Ended ({ended.length})</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {loadingComps ? (
            <div className="space-y-3 mt-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <>
              <TabsContent value="live" className="space-y-3 mt-4">
                {live.length ? live.map((c) => <CompRow key={c.id} c={c} />) : (
                  <EmptyStateCard icon={Trophy} title="No live competitions" description="Publish a draft or build a new competition to start receiving entries." actionLabel="Build a competition" actionLink="/organizer/competitions/new" variant="gradient" />
                )}
              </TabsContent>
              <TabsContent value="drafts" className="space-y-3 mt-4">
                {drafts.length ? drafts.map((c) => <CompRow key={c.id} c={c} />) : (
                  <EmptyStateCard icon={Pencil} title="No drafts" description="Drafts let you configure everything before going public." actionLabel="Start a draft" actionLink="/organizer/competitions/new" />
                )}
              </TabsContent>
              <TabsContent value="ended" className="space-y-3 mt-4">
                {ended.length ? ended.map((c) => <CompRow key={c.id} c={c} />) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No completed competitions yet.</p>
                )}
              </TabsContent>
              <TabsContent value="revenue" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" /> Revenue &amp; payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/60 p-4">
                        <div className="text-xs text-muted-foreground">Entries received</div>
                        <div className="text-xl font-bold">{revenue.contestants}</div>
                      </div>
                      <div className="rounded-xl border border-border/60 p-4">
                        <div className="text-xs text-muted-foreground">Paid votes</div>
                        <div className="text-xl font-bold">{revenue.votes}</div>
                      </div>
                      <div className="rounded-xl border border-border/60 p-4">
                        <div className="text-xs text-muted-foreground">Prize committed</div>
                        <div className="text-xl font-bold">{totalPrize.toLocaleString()} BAK</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Revenue is settled after each competition's fraud-review window closes. Your split is set per
                      competition in the builder and follows the platform defaults unless changed by an administrator.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/wallet">Open wallet &amp; request payout</Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
