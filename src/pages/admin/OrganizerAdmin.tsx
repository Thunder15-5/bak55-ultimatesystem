import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ShieldCheck, X, Star, Loader2, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { organizerTypeLabel } from "@/lib/organizers";
import { toast } from "sonner";

export default function OrganizerAdmin() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [comps, setComps] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingDefaults, setSavingDefaults] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: o }, { data: c }, { data: d }] = await Promise.all([
      supabase.from("organizers").select("*").order("created_at", { ascending: false }),
      supabase.from("competitions").select("id, title, status, featured, organizer_id, organizers(name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("platform_revenue_defaults").select("*").limit(1).maybeSingle(),
    ]);
    setOrgs(o ?? []);
    setComps(c ?? []);
    setDefaults(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setVerification = async (id: string, verification: string) => {
    const { error } = await supabase
      .from("organizers")
      .update({ verification: verification as any, verified_at: verification === "verified" ? new Date().toISOString() : null, verified_by: user?.id ?? null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setOrgs((cur) => cur.map((o) => (o.id === id ? { ...o, verification } : o)));
    toast.success(`Organizer ${verification}`);
  };

  const toggleFeatured = async (table: "organizers" | "competitions", id: string, value: boolean) => {
    const { error } = await supabase.from(table).update({ featured: value }).eq("id", id);
    if (error) return toast.error(error.message);
    if (table === "organizers") setOrgs((c) => c.map((o) => (o.id === id ? { ...o, featured: value } : o)));
    else setComps((c) => c.map((x) => (x.id === id ? { ...x, featured: value } : x)));
    toast.success(value ? "Featured" : "Unfeatured");
  };

  const saveDefaults = async () => {
    if (!defaults) return;
    setSavingDefaults(true);
    const { error } = await supabase
      .from("platform_revenue_defaults")
      .update({
        entry_fee_platform_pct: Number(defaults.entry_fee_platform_pct),
        entry_fee_organizer_pct: 100 - Number(defaults.entry_fee_platform_pct),
        voting_platform_pct: Number(defaults.voting_platform_pct),
        voting_artist_pct: Number(defaults.voting_artist_pct),
        voting_organizer_pct: Number(defaults.voting_organizer_pct),
        updated_by: user?.id ?? null,
      })
      .eq("id", defaults.id);
    setSavingDefaults(false);
    if (error) return toast.error(error.message);
    toast.success("Platform revenue defaults updated");
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pt-24 pb-24">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Organizer administration</h1>
          <p className="text-sm text-muted-foreground">Verify organizations, feature competitions and set platform revenue splits.</p>
        </div>

        <Tabs defaultValue="organizers">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="organizers">Organizers</TabsTrigger>
            <TabsTrigger value="competitions">Competitions</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="organizers" className="space-y-3 mt-4">
            {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />) : orgs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No organizer accounts yet.</p>
            ) : orgs.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {o.logo_url ? <img src={o.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {organizerTypeLabel(o.organizer_type)} · <span className="capitalize">{o.verification}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="hero" onClick={() => setVerification(o.id, "verified")} disabled={o.verification === "verified"}>
                      <ShieldCheck className="w-4 h-4 mr-1" /> Verify
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setVerification(o.id, "rejected")}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleFeatured("organizers", o.id, !o.featured)}>
                      <Star className={`w-4 h-4 mr-1 ${o.featured ? "fill-current text-primary" : ""}`} /> Feature
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="competitions" className="space-y-3 mt-4">
            {comps.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.organizers?.name ?? "BAK55 Talent"} · <span className="capitalize">{c.status}</span>
                    </p>
                  </div>
                  {c.featured && <Badge className="bg-primary/15 text-primary border-0">Featured</Badge>}
                  <Button size="sm" variant="outline" onClick={() => toggleFeatured("competitions", c.id, !c.featured)}>
                    <Star className={`w-4 h-4 ${c.featured ? "fill-current text-primary" : ""}`} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Percent className="w-5 h-5 text-primary" /> Platform revenue defaults</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!defaults ? <Skeleton className="h-32 w-full" /> : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        ["entry_fee_platform_pct", "Platform share of entry fees (%)"],
                        ["voting_platform_pct", "Platform share of voting (%)"],
                        ["voting_artist_pct", "Artist share of voting (%)"],
                        ["voting_organizer_pct", "Organizer share of voting (%)"],
                      ].map(([key, label]) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            className="h-11"
                            inputMode="numeric"
                            value={defaults[key]}
                            onChange={(e) => setDefaults({ ...defaults, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These values pre-fill every new competition. Existing competitions keep the split saved on them.
                    </p>
                    <Button variant="hero" onClick={saveDefaults} disabled={savingDefaults}>
                      {savingDefaults ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save defaults"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
