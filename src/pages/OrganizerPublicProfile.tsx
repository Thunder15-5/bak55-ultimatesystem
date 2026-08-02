import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ShieldCheck, Globe, MapPin, Trophy, Users, Heart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { organizerTypeLabel } from "@/lib/organizers";
import { toast } from "sonner";
import { format } from "date-fns";

export default function OrganizerPublicProfile() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [comps, setComps] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: o } = await supabase.from("organizers").select("*").eq("slug", slug).maybeSingle();
      setOrg(o);
      if (o) {
        const [{ data: c }, { count }, { data: mine }] = await Promise.all([
          supabase.from("competitions").select("*, submissions(count)").eq("organizer_id", o.id).neq("status", "draft").order("created_at", { ascending: false }),
          supabase.from("organizer_followers").select("id", { count: "exact", head: true }).eq("organizer_id", o.id),
          user ? supabase.from("organizer_followers").select("id").eq("organizer_id", o.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
        ]);
        setComps(c ?? []);
        setFollowers(count ?? 0);
        setFollowing(!!mine);
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const toggleFollow = async () => {
    if (!user) return toast.error("Log in to follow organizers");
    const next = !following;
    setFollowing(next);
    setFollowers((f) => f + (next ? 1 : -1));
    const { error } = next
      ? await supabase.from("organizer_followers").insert({ organizer_id: org.id, user_id: user.id })
      : await supabase.from("organizer_followers").delete().eq("organizer_id", org.id).eq("user_id", user.id);
    if (error) {
      setFollowing(!next);
      setFollowers((f) => f + (next ? -1 : 1));
      toast.error(error.message);
    } else {
      toast.success(next ? `Following ${org.name}` : `Unfollowed ${org.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <main className="container mx-auto max-w-5xl px-4 pt-24 pb-24 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <main className="container mx-auto max-w-3xl px-4 pt-28 pb-24 text-center space-y-4">
          <h1 className="text-xl font-heading font-bold">Organizer not found</h1>
          <Button variant="outline" asChild><Link to="/organizers">Browse organizers</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="pt-16 pb-24">
        {/* Cover */}
        <div className="h-40 sm:h-56 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 relative">
          {org.cover_url && <img src={org.cover_url} alt={`${org.name} cover`} className="w-full h-full object-cover" />}
        </div>

        <div className="container mx-auto max-w-5xl px-4">
          <div className="-mt-10 flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl border-4 border-background bg-gradient-to-br from-primary to-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
              {org.logo_url ? <img src={org.logo_url} alt={`${org.name} logo`} className="w-full h-full object-cover" /> : <Building2 className="w-9 h-9 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold truncate">{org.name}</h1>
                {org.verification === "verified" && <ShieldCheck className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span>{organizerTypeLabel(org.organizer_type)}</span>
                {(org.city || org.country) && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[org.city, org.country].filter(Boolean).join(", ")}</span>}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
            <Button variant={following ? "outline" : "hero"} size="sm" onClick={toggleFollow}>
              <Heart className={`w-4 h-4 mr-1.5 ${following ? "fill-current" : ""}`} />
              {following ? "Following" : "Follow"}
            </Button>
          </div>

          {org.description && <p className="text-sm text-muted-foreground max-w-2xl mb-6 leading-relaxed">{org.description}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Competitions", value: comps.length, icon: Trophy },
              { label: "Contestants", value: comps.reduce((s, c) => s + (c.submissions?.[0]?.count ?? 0), 0), icon: Users },
              { label: "Followers", value: followers, icon: Heart },
              { label: "Prize awarded", value: `${Number(org.total_prize_awarded ?? 0).toLocaleString()} BAK`, icon: Trophy },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 space-y-1">
                  <s.icon className="w-4 h-4 text-primary" />
                  <div className="text-xl font-heading font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-lg font-heading font-bold mb-3">Competition history</h2>
          {comps.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                This organizer hasn't published a competition yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {comps.map((c) => (
                <Link key={c.id} to={`/competition/${c.id}`}>
                  <Card className="group hover:border-primary/40 transition-all">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{c.title}</h3>
                        <Badge variant="outline" className="capitalize text-[10px]">{c.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.start_date), "d MMM yyyy")} · {c.submissions?.[0]?.count ?? 0} entries ·{" "}
                        {Number(c.prize_amount).toLocaleString()} BAK
                      </p>
                      <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        View competition <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
