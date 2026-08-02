import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Check, X, Users, Vote, ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Sub {
  id: string;
  title: string;
  artist_id: string;
  status: string;
  moderation_status: string | null;
  vote_count: number | null;
  created_at: string;
}

export default function OrganizerCompetitionManage() {
  const { id } = useParams();
  const [comp, setComp] = useState<any>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("competitions").select("*").eq("id", id).maybeSingle(),
        supabase.from("submissions").select("*").eq("competition_id", id).order("created_at", { ascending: false }),
      ]);
      setComp(c);
      const list = (s as any as Sub[]) ?? [];
      setSubs(list);

      const ids = [...new Set(list.map((x) => x.artist_id))];
      if (ids.length) {
        const [{ data: aps }, { data: profs }] = await Promise.all([
          supabase.from("artist_profiles").select("user_id, stage_name").in("user_id", ids),
          supabase.from("profiles").select("id, display_name, username").in("id", ids),
        ]);
        const map: Record<string, string> = {};
        profs?.forEach((p: any) => { map[p.id] = p.display_name || p.username || "Unknown Artist"; });
        aps?.forEach((a: any) => { if (a.stage_name) map[a.user_id] = a.stage_name; });
        setNames(map);
      }
      setLoading(false);
    })();
  }, [id]);

  const moderate = async (subId: string, decision: "approved" | "rejected") => {
    const { error } = await supabase
      .from("submissions")
      .update({ moderation_status: decision, status: decision as any })
      .eq("id", subId);
    if (error) return toast.error(error.message);
    setSubs((cur) => cur.map((s) => (s.id === subId ? { ...s, moderation_status: decision, status: decision } : s)));
    toast.success(decision === "approved" ? "Contestant approved" : "Entry rejected");
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <main className="container mx-auto max-w-5xl px-4 pt-24 pb-24 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </main>
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <main className="container mx-auto max-w-3xl px-4 pt-28 pb-24 text-center space-y-4">
          <h1 className="text-xl font-heading font-bold">Competition not found</h1>
          <Button asChild variant="outline"><Link to="/organizer/dashboard">Back to dashboard</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pending = subs.filter((s) => (s.moderation_status ?? "pending") === "pending");
  const approved = subs.filter((s) => s.moderation_status === "approved");
  const rejected = subs.filter((s) => s.moderation_status === "rejected");
  const totalVotes = subs.reduce((sum, s) => sum + (s.vote_count ?? 0), 0);

  const Row = ({ s, actions }: { s: Sub; actions?: boolean }) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{s.title}</p>
          <p className="text-xs text-muted-foreground">
            {names[s.artist_id] ?? "Unknown Artist"} · {s.vote_count ?? 0} votes
          </p>
        </div>
        {actions ? (
          <div className="flex gap-2">
            <Button size="sm" variant="hero" onClick={() => moderate(s.id, "approved")}>
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => moderate(s.id, "rejected")}>
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        ) : (
          <Badge variant="outline" className="capitalize">{s.moderation_status ?? "pending"}</Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pt-24 pb-24">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/organizer/dashboard"><ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard</Link>
        </Button>

        <div className="space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">{comp.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {comp.status} · {Number(comp.prize_amount).toLocaleString()} BAK prize · {comp.judging_method?.replace("_", " ")}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Entries", value: subs.length, icon: Users },
            { label: "Approved", value: approved.length, icon: Trophy },
            { label: "Votes", value: totalVotes, icon: Vote },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 space-y-1">
                <s.icon className="w-4 h-4 text-primary" />
                <div className="text-2xl font-heading font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Contestants ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pending.length ? pending.map((s) => <Row key={s.id} s={s} actions />) : (
              <p className="text-sm text-muted-foreground text-center py-8">No applications waiting for review.</p>
            )}
          </TabsContent>
          <TabsContent value="approved" className="space-y-3 mt-4">
            {approved.length ? approved.map((s) => <Row key={s.id} s={s} />) : (
              <p className="text-sm text-muted-foreground text-center py-8">No approved contestants yet.</p>
            )}
          </TabsContent>
          <TabsContent value="rejected" className="space-y-3 mt-4">
            {rejected.length ? rejected.map((s) => <Row key={s.id} s={s} />) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nothing rejected.</p>
            )}
          </TabsContent>
          <TabsContent value="votes" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Vote leaderboard</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[...approved].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm truncate">
                      <span className="text-muted-foreground mr-2">#{i + 1}</span>
                      {names[s.artist_id] ?? "Unknown Artist"} — {s.title}
                    </span>
                    <span className="text-sm font-semibold">{s.vote_count ?? 0}</span>
                  </div>
                ))}
                {!approved.length && <p className="text-sm text-muted-foreground text-center py-6">No votes yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
