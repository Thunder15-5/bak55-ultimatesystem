import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizer } from "@/hooks/useOrganizer";
import { ORGANIZER_TYPES, slugify } from "@/lib/organizers";
import { toast } from "sonner";

export default function OrganizerSetup() {
  const { user } = useAuth();
  const { organizer, loading, refresh } = useOrganizer();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    organizer_type: "studio",
    description: "",
    website: "",
    country: "Kenya",
    city: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
    cover_url: "",
    instagram: "",
    twitter: "",
  });

  useEffect(() => {
    if (organizer) {
      setForm({
        name: organizer.name,
        organizer_type: organizer.organizer_type,
        description: organizer.description ?? "",
        website: organizer.website ?? "",
        country: organizer.country ?? "",
        city: organizer.city ?? "",
        contact_email: organizer.contact_email ?? "",
        contact_phone: organizer.contact_phone ?? "",
        logo_url: organizer.logo_url ?? "",
        cover_url: organizer.cover_url ?? "",
        instagram: organizer.socials?.instagram ?? "",
        twitter: organizer.socials?.twitter ?? "",
      });
    }
  }, [organizer]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!user) return;
    if (form.name.trim().length < 2) {
      toast.error("Please enter your organization name");
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: user.id,
      name: form.name.trim(),
      organizer_type: form.organizer_type as any,
      description: form.description || null,
      website: form.website || null,
      country: form.country || null,
      city: form.city || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      logo_url: form.logo_url || null,
      cover_url: form.cover_url || null,
      socials: { instagram: form.instagram || null, twitter: form.twitter || null },
    };

    try {
      if (organizer) {
        const { error } = await supabase.from("organizers").update(payload).eq("id", organizer.id);
        if (error) throw error;
        toast.success("Organizer profile updated");
      } else {
        const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
        const { error } = await supabase.from("organizers").insert({ ...payload, slug });
        if (error) throw error;
        // Grant the organizer role (ignore duplicates)
        await supabase.from("user_roles").insert({ user_id: user.id, role: "organizer" as any });
        toast.success("Organizer profile created — verification pending");
      }
      await refresh();
      navigate("/organizer/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save your organizer profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 pt-24 pb-24">
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Organizer account
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">
            {organizer ? "Edit your organization" : "Set up your organization"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Host competitions on BAK55 with your own branding, rules, prizes and revenue share.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization name *</Label>
                <Input id="name" className="h-12" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sarakasi Studios" />
              </div>
              <div className="space-y-2">
                <Label>Organizer type *</Label>
                <Select value={form.organizer_type} onValueChange={(v) => set("organizer_type", v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORGANIZER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">About your organization</Label>
              <Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What you do, who you work with, and the kind of talent you're looking for." />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" className="h-12" inputMode="url" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover">Cover image URL</Label>
                <Input id="cover" className="h-12" inputMode="url" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" className="h-12" value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" className="h-12" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" className="h-12" inputMode="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact phone</Label>
                <Input id="phone" className="h-12" inputMode="tel" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" className="h-12" inputMode="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">Instagram</Label>
                <Input id="ig" className="h-12" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle" />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                New organizations start as <strong>unverified</strong>. You can build competitions and save drafts right away —
                publishing publicly requires verification by the BAK55 team.
              </p>
            </div>

            <Button variant="hero" className="w-full h-12" disabled={saving} onClick={handleSubmit}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : organizer ? "Save changes" : "Create organizer account"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
