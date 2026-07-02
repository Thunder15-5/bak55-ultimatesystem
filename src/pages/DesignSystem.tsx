import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { toast } from "sonner";
import {
  Coins,
  Music2,
  Mic2,
  Sparkles,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
  Trophy,
  Heart,
  Radio,
  Loader2,
} from "lucide-react";

/**
 * BAK55 Design System — internal preview at /design-system
 * Not linked from public nav. Used to keep new components aligned with tokens.
 */
export default function DesignSystem() {
  const [demoDialog, setDemoDialog] = useState(false);

  const Section = ({ id, title, subtitle, children }: any) => (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">{id}</div>
        <h2 className="text-2xl md:text-3xl font-heading font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 md:p-6">
        {children}
      </div>
    </section>
  );

  const Swatch = ({ name, cssVar, hint }: { name: string; cssVar: string; hint?: string }) => (
    <div className="space-y-2">
      <div
        className="h-16 rounded-xl border border-white/8 shadow-inner-glow"
        style={{ background: `hsl(var(--${cssVar}))` }}
      />
      <div className="text-xs">
        <div className="font-semibold">{name}</div>
        <div className="text-muted-foreground font-mono text-[10px]">--{cssVar}</div>
        {hint && <div className="text-muted-foreground text-[10px] mt-0.5">{hint}</div>}
      </div>
    </div>
  );

  const colorTokens: { name: string; cssVar: string; hint?: string }[] = [
    { name: "Background", cssVar: "background" },
    { name: "Card", cssVar: "card" },
    { name: "Muted", cssVar: "muted" },
    { name: "Border", cssVar: "border" },
    { name: "Primary", cssVar: "primary", hint: "Purple — brand" },
    { name: "Primary glow", cssVar: "primary-glow" },
    { name: "Secondary", cssVar: "secondary", hint: "Warm orange" },
    { name: "Accent", cssVar: "accent", hint: "Electric cyan" },
    { name: "Success", cssVar: "success" },
    { name: "Warning", cssVar: "warning" },
    { name: "Destructive", cssVar: "destructive" },
    { name: "Foreground", cssVar: "foreground" },
  ];

  const spacing = [
    { t: "2", px: 8 },
    { t: "3", px: 12 },
    { t: "4", px: 16 },
    { t: "6", px: 24 },
    { t: "8", px: 32 },
    { t: "12", px: 48 },
    { t: "16", px: 64 },
    { t: "24", px: 96 },
  ];

  const nav = [
    { id: "01", label: "Typography" },
    { id: "02", label: "Color" },
    { id: "03", label: "Spacing" },
    { id: "04", label: "Buttons" },
    { id: "05", label: "Cards" },
    { id: "06", label: "Forms" },
    { id: "07", label: "Tabs" },
    { id: "08", label: "Modals" },
    { id: "09", label: "Alerts" },
    { id: "10", label: "Badges" },
    { id: "11", label: "Empty States" },
    { id: "12", label: "Toasts" },
  ];

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Header */}
        <header className="mb-10 md:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
            <Sparkles className="w-3 h-3" /> BAK55 · Design System v1
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
            Built for <span className="text-gradient">bold nights</span> & big cheques.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Late-night studio meets fintech confidence. Dark canvas, neon conviction, editorial type.
            Every surface below is a token — never hardcode colors or radii in components.
          </p>
        </header>

        {/* Section nav */}
        <nav className="flex flex-wrap gap-2 mb-10">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[.04] border border-white/8 hover:border-primary/40 hover:bg-primary/10 transition-colors"
            >
              <span className="text-muted-foreground mr-1.5">{n.id}</span>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="space-y-14">
          {/* 01 Typography */}
          <Section id="01" title="Typography" subtitle="Outfit for display, Manrope for body. Max 3 sizes per screen.">
            <div className="space-y-6">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Display XL · Outfit 800</div>
                <p className="text-4xl md:text-6xl font-heading font-extrabold leading-[1.05]">Own your sound.</p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">H1 · Outfit 700</div>
                <p className="text-3xl font-heading font-bold">Rising Stars — Season 2</p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">H2 · Outfit 700</div>
                <p className="text-2xl font-heading font-bold">Top performing tracks this week</p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Body · Manrope 400</div>
                <p className="text-base leading-relaxed max-w-prose text-foreground/90">
                  BAK55 gives artists and fans in Africa the tools to build careers, win real prize money, and
                  turn every stream into ownership. Vote, upload, cash out — no gatekeepers.
                </p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Caption · Manrope 600 · 0.08em tracking</div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">Verified · Rising Star · L3</p>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Numeric · tabular</div>
                <p className="text-2xl font-mono font-semibold tabular-nums">1,248.50 <span className="text-primary text-base">BAK</span></p>
              </div>
            </div>
          </Section>

          {/* 02 Color */}
          <Section id="02" title="Color tokens" subtitle="All HSL, all semantic. Never write text-white / bg-black.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colorTokens.map((c) => (
                <Swatch key={c.cssVar} {...c} />
              ))}
            </div>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="h-24 rounded-xl bg-gradient-hero shadow-elegant flex items-end p-3">
                <span className="text-xs font-semibold text-white/90">--gradient-hero</span>
              </div>
              <div className="h-24 rounded-xl bg-gradient-primary flex items-end p-3">
                <span className="text-xs font-semibold text-white/90">--gradient-primary</span>
              </div>
              <div className="h-24 rounded-xl bg-gradient-card border border-white/8 flex items-end p-3">
                <span className="text-xs font-semibold text-muted-foreground">--gradient-card</span>
              </div>
            </div>
          </Section>

          {/* 03 Spacing */}
          <Section id="03" title="Spacing & rhythm" subtitle="8-based scale. Between cards: space-y-4 mobile / space-y-6 desktop.">
            <div className="space-y-3">
              {spacing.map((s) => (
                <div key={s.t} className="flex items-center gap-4">
                  <div className="w-16 text-xs font-mono text-muted-foreground">tw {s.t}</div>
                  <div className="h-3 bg-primary/70 rounded" style={{ width: `${s.px * 2}px` }} />
                  <div className="text-xs text-muted-foreground">{s.px}px</div>
                </div>
              ))}
            </div>
          </Section>

          {/* 04 Buttons */}
          <Section id="04" title="Buttons" subtitle="One primary per screen. Mobile default h-12, desktop h-10.">
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg">Hero · Primary</Button>
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="premium">Premium</Button>
              <Button variant="glass">Glass</Button>
              <Button disabled><Loader2 className="animate-spin" /> Loading</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl" variant="hero">XL Hero</Button>
              <Button size="icon" variant="outline"><Heart /></Button>
            </div>
          </Section>

          {/* 05 Cards */}
          <Section id="05" title="Cards" subtitle="rounded-2xl · border-white/8 · shadow-elegant on hover.">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-white/8 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Standard</CardTitle>
                  <CardDescription>Base surface for data.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Content cards use p-5 on mobile, p-6 on desktop.
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/20 bg-gradient-card shadow-glow-primary">
                <CardHeader>
                  <CardTitle className="text-xl">Elevated</CardTitle>
                  <CardDescription>Feature / earnings.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Adds glow on hover. Reserved for high-signal moments.
                </CardContent>
              </Card>
              <Card className="rounded-2xl bg-gradient-hero text-white border-transparent">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Hero</CardTitle>
                  <CardDescription className="text-white/70">Prize / winner banner.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-white/80">
                  Use sparingly. One per screen max.
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* 06 Forms + 07 Inputs */}
          <Section id="06" title="Forms & Inputs" subtitle="h-12 mobile, always inputMode + autoComplete, focus ring.">
            <div className="max-w-md space-y-5">
              <div className="space-y-2">
                <Label htmlFor="ds-email" className="text-sm font-semibold">Email</Label>
                <Input id="ds-email" type="email" placeholder="you@example.com" className="h-12" inputMode="email" autoComplete="email" />
                <p className="text-xs text-muted-foreground">We'll send a sign-in link — no password.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-amount" className="text-sm font-semibold">Vote amount</Label>
                <div className="relative">
                  <Input id="ds-amount" type="number" placeholder="0" className="h-12 pr-16 font-mono" inputMode="numeric" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">BAK</div>
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 5, 10, 25].map((n) => (
                  <button key={n} className="flex-1 h-10 rounded-full bg-white/[.04] border border-white/8 text-sm font-semibold hover:border-primary/40 hover:bg-primary/10 transition">
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* 07 Tabs */}
          <Section id="07" title="Tabs" subtitle="Underline for content nav, pills for filters. Max 5 tabs, then overflow.">
            <Tabs defaultValue="tracks" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 gap-1">
                {["tracks", "fans", "revenue", "amplify"].map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-4 py-2.5 capitalize"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="tracks" className="pt-4 text-sm text-muted-foreground">
                Underline tabs · content lives here.
              </TabsContent>
              <TabsContent value="fans" className="pt-4 text-sm text-muted-foreground">Fans panel.</TabsContent>
              <TabsContent value="revenue" className="pt-4 text-sm text-muted-foreground">Revenue panel.</TabsContent>
              <TabsContent value="amplify" className="pt-4 text-sm text-muted-foreground">Amplify panel.</TabsContent>
            </Tabs>

            <div className="mt-6 flex flex-wrap gap-2">
              {["All", "Afrobeats", "Hip-Hop", "R&B", "Amapiano", "Drill"].map((f, i) => (
                <button
                  key={f}
                  className={`h-9 px-4 rounded-full text-sm font-semibold transition ${
                    i === 0
                      ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-md"
                      : "bg-white/[.04] border border-white/8 hover:border-primary/40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Section>

          {/* 08 Modals */}
          <Section id="08" title="Modals" subtitle="Centered on desktop, bottom-sheet feel on mobile. One primary action.">
            <Dialog open={demoDialog} onOpenChange={setDemoDialog}>
              <DialogTrigger asChild>
                <Button variant="hero">Open dialog</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-white/10">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">Cast your vote</DialogTitle>
                  <DialogDescription>10 BAK · goes 65% to the artist, 35% to the prize pool.</DialogDescription>
                </DialogHeader>
                <div className="py-4 flex items-center justify-between rounded-xl bg-white/[.03] border border-white/8 p-4">
                  <span className="text-sm text-muted-foreground">You'll pay</span>
                  <span className="font-mono font-bold text-lg">10.00 BAK</span>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDemoDialog(false)}>Cancel</Button>
                  <Button variant="hero" onClick={() => setDemoDialog(false)}>Confirm vote</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Section>

          {/* 09 Alerts */}
          <Section id="09" title="Alerts" subtitle="Icon left, single-line title, 1-line description, optional inline action.">
            <div className="space-y-3">
              <Alert className="border-l-4 border-l-primary bg-primary/8">
                <Info className="w-4 h-4 text-primary" />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>Amplify Boost campaigns now auto-refund if delivery drops below 50%.</AlertDescription>
              </Alert>
              <Alert className="border-l-4 border-l-success bg-success/8">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <AlertTitle>Payout sent</AlertTitle>
                <AlertDescription>250 BAK cashed out to M-Pesa · +254 7•• ••• 442.</AlertDescription>
              </Alert>
              <Alert className="border-l-4 border-l-warning bg-warning/8">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <AlertTitle>KYC pending</AlertTitle>
                <AlertDescription>Verify your ID to unlock withdrawals over 250 BAK.</AlertDescription>
              </Alert>
              <Alert className="border-l-4 border-l-destructive bg-destructive/8">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <AlertTitle>Upload failed</AlertTitle>
                <AlertDescription>File exceeds 15 MB. Try compressing or re-exporting.</AlertDescription>
              </Alert>
            </div>
          </Section>

          {/* 10 Badges */}
          <Section id="10" title="Status badges" subtitle="Uppercase, tabular. Use tone to signal state — never color alone.">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-destructive/15 text-destructive border border-destructive/30 uppercase text-[10px] tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5 animate-pulse" /> Live
              </Badge>
              <Badge className="bg-primary/15 text-primary border border-primary/30 uppercase text-[10px] tracking-wider">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
              </Badge>
              <Badge className="bg-warning/15 text-warning border border-warning/30 uppercase text-[10px] tracking-wider">Pending</Badge>
              <Badge className="bg-success/15 text-success border border-success/30 uppercase text-[10px] tracking-wider">Paid</Badge>
              <Badge className="bg-white/8 text-muted-foreground border border-white/10 uppercase text-[10px] tracking-wider">Draft</Badge>
              <Badge className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground uppercase text-[10px] tracking-wider">
                <Trophy className="w-3 h-3 mr-1" /> L3 Artist
              </Badge>
              <Badge className="bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground uppercase text-[10px] tracking-wider">
                <Zap className="w-3 h-3 mr-1" /> Boosted
              </Badge>
            </div>
          </Section>

          {/* 11 Empty States */}
          <Section id="11" title="Empty states" subtitle="Icon → title → 1-line copy → single primary CTA.">
            <div className="grid md:grid-cols-2 gap-4">
              <EmptyStateCard
                icon={Music2}
                title="No tracks yet"
                description="Upload your first track and start earning within minutes."
                actionLabel="Upload track"
                actionLink="/artist/upload"
                variant="gradient"
              />
              <EmptyStateCard
                icon={Radio}
                title="No live streams"
                description="Go live and let fans tip you in real time."
                actionLabel="Start streaming"
                actionLink="/live-streams"
              />
            </div>
          </Section>

          {/* 12 Toasts */}
          <Section id="12" title="Toasts" subtitle="Auto-dismiss 4s. Top on mobile, bottom-right desktop. Max 2 lines.">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => toast.success("Track uploaded", { description: "Live in your catalog." })}>Success</Button>
              <Button variant="outline" onClick={() => toast.error("Payment failed", { description: "M-Pesa timed out. Try again." })}>Error</Button>
              <Button variant="outline" onClick={() => toast.info("Amplify running", { description: "3.2K impressions so far." })}>Info</Button>
              <Button variant="outline" onClick={() => toast("New follower", { description: "@dj_kayz just followed you", icon: <Bell className="w-4 h-4 text-primary" /> })}>Neutral</Button>
            </div>
          </Section>
        </div>

        <footer className="mt-16 pt-8 border-t border-white/8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>BAK55 · Design System v1 · Internal reference</span>
          <span className="font-mono">Tokens live in <span className="text-foreground">src/index.css</span></span>
        </footer>
      </div>
    </div>
  );
}
