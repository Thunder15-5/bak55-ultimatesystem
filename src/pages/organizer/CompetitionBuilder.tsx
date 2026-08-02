import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, ArrowRight, Check, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizer } from "@/hooks/useOrganizer";
import { COMPETITION_TYPES, JUDGING_METHODS } from "@/lib/organizers";
import { toast } from "sonner";

const STEPS = ["Basics", "Entry & voting", "Schedule", "Judging", "Prizes", "Rules"] as const;

const defaultForm = {
  title: "",
  competition_type: "music",
  genres: "",
  country: "Kenya",
  description: "",
  cover_image: "",
  entry_fee: "0",
  vote_price: "1",
  max_submissions: "",
  registration_start: "",
  registration_end: "",
  start_date: "",
  end_date: "",
  voting_start_date: "",
  voting_end_date: "",
  judging_method: "hybrid",
  prize_amount: "",
  rules: "",
  entry_fee_platform_pct: "35",
  voting_platform_pct: "35",
  voting_artist_pct: "65",
  voting_organizer_pct: "0",
};

export default function CompetitionBuilder() {
  const { id } = useParams();
  const { user } = useAuth();
  const { organizer, loading } = useOrganizer();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loadingComp, setLoadingComp] = useState(!!id);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("competitions").select("*").eq("id", id).maybeSingle();
      const cfg = await supabase.from("competition_revenue_config").select("*").eq("competition_id", id).maybeSingle();
      if (data) {
        const d: any = data;
        const iso = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : "");
        setForm({
          ...defaultForm,
          title: d.title ?? "",
          competition_type: d.competition_type ?? "music",
          genres: (d.genres ?? []).join(", "),
          country: d.country ?? "",
          description: d.description ?? "",
          cover_image: d.cover_image ?? "",
          entry_fee: String(d.entry_fee ?? 0),
          vote_price: String(d.vote_price ?? 1),
          max_submissions: d.max_submissions ? String(d.max_submissions) : "",
          registration_start: iso(d.registration_start),
          registration_end: iso(d.registration_end),
          start_date: iso(d.start_date),
          end_date: iso(d.end_date),
          voting_start_date: iso(d.voting_start_date),
          voting_end_date: iso(d.voting_end_date),
          judging_method: d.judging_method ?? "hybrid",
          prize_amount: String(d.prize_amount ?? ""),
          rules: d.rules ?? "",
          entry_fee_platform_pct: String(cfg.data?.entry_fee_platform_pct ?? 35),
          voting_platform_pct: String(cfg.data?.voting_platform_pct ?? 35),
          voting_artist_pct: String(cfg.data?.voting_artist_pct ?? 65),
          voting_organizer_pct: String(cfg.data?.voting_organizer_pct ?? 0),
        });
      }
      setLoadingComp(false);
    })();
  }, [id]);

  const validate = () => {
    if (!form.title.trim()) return "Give your competition a title";
    if (!form.start_date || !form.end_date) return "Set a start and end date";
    if (new Date(form.end_date) <= new Date(form.start_date)) return "End date must be after the start date";
    if (!form.prize_amount || Number(form.prize_amount) <= 0) return "Set a prize amount";
    return null;
  };

  const save = async (publish: boolean) => {
    if (!user || !organizer) return;
    const err = validate();
    if (err) return toast.error(err);
    if (publish && organizer.verification !== "verified") {
      return toast.error("Your organization must be verified before publishing");
    }

    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description || null,
        competition_type: form.competition_type,
        country: form.country || null,
        genres: form.genres ? form.genres.split(",").map((g) => g.trim()).filter(Boolean) : null,
        cover_image: form.cover_image || null,
        entry_fee: Number(form.entry_fee) || 0,
        vote_price: Number(form.vote_price) || 1,
        max_submissions: form.max_submissions ? Number(form.max_submissions) : null,
        registration_start: form.registration_start || null,
        registration_end: form.registration_end || null,
        start_date: form.start_date,
        end_date: form.end_date,
        voting_start_date: form.voting_start_date || null,
        voting_end_date: form.voting_end_date || null,
        judging_method: form.judging_method,
        prize_amount: Number(form.prize_amount),
        rules: form.rules || null,
        organizer_id: organizer.id,
        created_by: user.id,
        status: publish ? "active" : "draft",
      };

      let compId = id;
      if (id) {
        const { error } = await supabase.from("competitions").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("competitions").insert(payload).select("id").single();
        if (error) throw error;
        compId = data.id;
      }

      await supabase.from("competition_revenue_config").upsert(
        {
          competition_id: compId!,
          entry_fee_platform_pct: Number(form.entry_fee_platform_pct),
          entry_fee_organizer_pct: 100 - Number(form.entry_fee_platform_pct),
          voting_platform_pct: Number(form.voting_platform_pct),
          voting_artist_pct: Number(form.voting_artist_pct),
          voting_organizer_pct: Number(form.voting_organizer_pct),
        },
        { onConflict: "competition_id" }
      );

      toast.success(publish ? "Competition published" : "Draft saved");
      navigate("/organizer/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the competition");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingComp) {
    return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!organizer) {
    navigate("/organizer/setup", { replace: true });
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 pt-24 pb-32">
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
            <Trophy className="w-4 h-4" /> Competition builder
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">{id ? "Edit competition" : "Create a competition"}</h1>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  i === step ? "bg-primary text-primary-foreground border-primary" : i < step ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {i < step && <Check className="w-3 h-3 inline mr-1" />}{s}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">{STEPS[step]}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" className="h-12" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Nairobi Rising Stars 2026" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.competition_type} onValueChange={(v) => set("competition_type", v)}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPETITION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" className="h-12" value={form.country} onChange={(e) => set("country", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genres">Genres (comma separated)</Label>
                    <Input id="genres" className="h-12" value={form.genres} onChange={(e) => set("genres", e.target.value)} placeholder="Afrobeats, Gengetone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner">Banner image URL</Label>
                    <Input id="banner" className="h-12" inputMode="url" value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>
              </>
            )}

            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee">Entry fee (BAK)</Label>
                  <Input id="fee" className="h-12" inputMode="decimal" value={form.entry_fee} onChange={(e) => set("entry_fee", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vp">Voting price (BAK per vote)</Label>
                  <Input id="vp" className="h-12" inputMode="decimal" value={form.vote_price} onChange={(e) => set("vote_price", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="max">Maximum contestants</Label>
                  <Input id="max" className="h-12" inputMode="numeric" value={form.max_submissions} onChange={(e) => set("max_submissions", e.target.value)} placeholder="Leave blank for unlimited" />
                </div>
                <div className="sm:col-span-2 rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Revenue split</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Platform share of entry fees (%)</Label>
                      <Input className="h-11" inputMode="numeric" value={form.entry_fee_platform_pct} onChange={(e) => set("entry_fee_platform_pct", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Platform share of voting (%)</Label>
                      <Input className="h-11" inputMode="numeric" value={form.voting_platform_pct} onChange={(e) => set("voting_platform_pct", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Artist share of voting (%)</Label>
                      <Input className="h-11" inputMode="numeric" value={form.voting_artist_pct} onChange={(e) => set("voting_artist_pct", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Organizer share of voting (%)</Label>
                      <Input className="h-11" inputMode="numeric" value={form.voting_organizer_pct} onChange={(e) => set("voting_organizer_pct", e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Defaults follow the BAK55 platform split. Administrators can override these percentages.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["registration_start", "Registration opens"],
                  ["registration_end", "Registration closes"],
                  ["start_date", "Competition starts *"],
                  ["end_date", "Competition ends *"],
                  ["voting_start_date", "Voting opens"],
                  ["voting_end_date", "Voting closes"],
                ].map(([key, label]) => (
                  <div className="space-y-2" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input id={key} type="datetime-local" className="h-12" value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {JUDGING_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set("judging_method", m.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      form.judging_method === m.value ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>
                  </button>
                ))}
                <p className="text-xs text-muted-foreground">
                  Judges can be invited from the competition management screen once the competition is created.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prize">Total prize pool (BAK) *</Label>
                  <Input id="prize" className="h-12" inputMode="decimal" value={form.prize_amount} onChange={(e) => set("prize_amount", e.target.value)} />
                </div>
                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                  <p className="text-sm font-medium">Default prize distribution</p>
                  <div className="flex gap-2 flex-wrap text-xs">
                    <Badge variant="outline">1st · 50%</Badge>
                    <Badge variant="outline">2nd · 30%</Badge>
                    <Badge variant="outline">3rd · 20%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Custom prize positions and sponsor logos can be added from the management screen after creation.
                  </p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rules">Rules &amp; terms</Label>
                  <Textarea id="rules" rows={8} value={form.rules} onChange={(e) => set("rules", e.target.value)} placeholder="Eligibility, submission requirements, disqualification rules, prize payout terms..." />
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-1 text-sm">
                  <p className="font-medium">Review</p>
                  <p className="text-muted-foreground text-xs">
                    {form.title || "Untitled"} · {form.prize_amount || 0} BAK prize · entry {form.entry_fee} BAK · vote {form.vote_price} BAK
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 gap-2">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="hero" onClick={() => setStep((s) => s + 1)}>
                  Next <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" disabled={saving} onClick={() => save(false)}>Save draft</Button>
                  <Button variant="hero" disabled={saving} onClick={() => save(true)}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
