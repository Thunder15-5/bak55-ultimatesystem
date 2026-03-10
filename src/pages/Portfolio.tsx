import { useState, useEffect, useRef } from "react";
import {
  Mail, Phone, Globe, ArrowRight, ExternalLink, ChevronDown, Send,
  Code, Palette, Music, Video, Megaphone, Users, Sparkles,
  GraduationCap, Briefcase, Rocket, Target, Heart, Quote,
  Newspaper, Mic, Radio, Image, Play, Trophy, TrendingUp,
  Star, Zap, Upload, Vote, BarChart3, DollarSign, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEO/SEOHead";

/* ─── Intersection Observer hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimateIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const NAV_ITEMS = ["About", "Mission", "Projects", "Building", "Milestones", "Skills", "Experience", "Creative", "Contact"];

const TECHNICAL_SKILLS = [
  { label: "Web Development", icon: Code },
  { label: "React", icon: Code },
  { label: "TypeScript", icon: Code },
  { label: "Tailwind CSS", icon: Palette },
  { label: "Product Development", icon: Sparkles },
  { label: "UI/UX Optimization", icon: Palette },
];

const CREATIVE_SKILLS = [
  { label: "Artist Development", icon: Music },
  { label: "Social Media Strategy", icon: Megaphone },
  { label: "Music Video Editing", icon: Video },
  { label: "Visual Storytelling", icon: Palette },
  { label: "Digital Marketing", icon: Users },
];

const FEATURES = ["Artist music uploads", "Competition system", "Fan voting", "Community discovery", "Artist growth tools"];

const MILESTONES = [
  { year: "2025", label: "Founded BAK55 Talent Initiative", icon: Rocket },
  { year: "2025", label: "Built the first version of the BAK55 music platform", icon: Code },
  { year: "2026", label: "Selected for ALX Ventures Founder Academy", icon: GraduationCap },
  { year: "Present", label: "Developing tools for African artist growth", icon: TrendingUp },
];

const BUILDING_CARDS = [
  { title: "BAK55 Talent Initiative", desc: "A platform empowering African artists through competitions, fan engagement, and music discovery.", icon: Music, color: "hsl(265,85%,58%)" },
  { title: "Artist Growth Systems", desc: "Developing systems that help artists understand and grow their audience.", icon: TrendingUp, color: "hsl(175,90%,48%)" },
  { title: "African Music Ecosystem", desc: "Creating opportunities and visibility for emerging African musicians.", icon: Globe, color: "hsl(28,100%,58%)" },
];

const TESTIMONIALS = [
  { quote: "Bith helped bring my music video vision to life and guided the creative storytelling.", author: "Artist Collaboration", avatar: "🎤" },
  { quote: "His understanding of what artists need in a platform is unmatched. BAK55 is game-changing.", author: "Early Platform User", avatar: "🎵" },
  { quote: "A rare combination of technical skill and creative vision. He truly gets the music industry.", author: "Industry Partner", avatar: "🤝" },
];

const MEDIA_ITEMS = [
  { title: "Interviews", desc: "Coming soon — founder interviews and industry conversations.", icon: Mic },
  { title: "Articles", desc: "Thought leadership on African music tech and artist empowerment.", icon: Newspaper },
  { title: "Podcast Appearances", desc: "Upcoming appearances discussing the future of music in Africa.", icon: Radio },
  { title: "Industry Features", desc: "Platform spotlights and ecosystem analysis.", icon: Star },
];

const ECOSYSTEM_STEPS = [
  { label: "Artists Upload Music", icon: Upload, color: "hsl(265,85%,58%)" },
  { label: "Competitions", icon: Trophy, color: "hsl(28,100%,58%)" },
  { label: "Fan Engagement", icon: Headphones, color: "hsl(175,90%,48%)" },
  { label: "Fan Voting", icon: Vote, color: "hsl(265,85%,68%)" },
  { label: "Artist Growth", icon: BarChart3, color: "hsl(145,80%,42%)" },
  { label: "Revenue Opportunities", icon: DollarSign, color: "hsl(28,100%,68%)" },
];

const CREATIVE_GALLERY = [
  { title: "Music Video Editing", type: "video", thumb: "/portfolio/bith-hero.jpeg" },
  { title: "BAK55 Platform UI", type: "screenshot", thumb: "/portfolio/bith-about.jpeg" },
  { title: "Creative Direction", type: "visual", thumb: "/portfolio/bith-hero.jpeg" },
  { title: "Brand & Identity", type: "branding", thumb: "/portfolio/bith-about.jpeg" },
  { title: "Visual Storytelling", type: "visual", thumb: "/portfolio/bith-hero.jpeg" },
  { title: "Digital Campaigns", type: "campaign", thumb: "/portfolio/bith-about.jpeg" },
];

/* ─── Section label helper ─── */
function SectionLabel({ text, color = "hsl(265,85%,68%)" }: { text: string; color?: string }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color }}>{text}</p>;
}

/* ─── Component ─── */
export default function Portfolio() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) { toast.error("Please fill all fields"); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success("Message sent! I'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
    setSending(false);
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <SEOHead
        title="Bith Agustine — Tech Founder, Developer & Creative Strategist"
        description="Founder of BAK55 Talent Initiative. Building technology and opportunities for African artists through competitions, fan engagement, and digital growth."
        url="https://bak55talent.co.ke/portfolio"
        image="https://bak55talent.co.ke/portfolio/bith-hero.jpeg"
      />

      <div className="min-h-screen bg-[hsl(220,20%,4%)] text-[hsl(0,0%,93%)] overflow-x-hidden selection:bg-[hsl(265,85%,58%)/30] selection:text-white">

        {/* ─── STICKY NAV ─── */}
        <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[hsl(220,20%,4%)/80] border-b border-white/5">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
            <button onClick={() => scrollTo("hero")} className="font-semibold text-sm tracking-tight hover:text-white/80 transition">
              BA<span className="text-[hsl(265,85%,58%)]">.</span>
            </button>
            <div className="hidden lg:flex items-center gap-6 text-xs font-medium text-white/50">
              {NAV_ITEMS.map(s => (
                <button key={s} onClick={() => scrollTo(s.toLowerCase())} className="hover:text-white transition">{s}</button>
              ))}
            </div>
            <Button size="sm" onClick={() => scrollTo("contact")} className="bg-[hsl(265,85%,58%)] hover:bg-[hsl(265,85%,50%)] text-white text-xs h-8 px-4 rounded-full">
              Get in Touch
            </Button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            1. HERO
        ═══════════════════════════════════════════ */}
        <section id="hero" className="relative min-h-[100dvh] flex items-center justify-center pt-14">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(265,85%,58%)] opacity-[0.06] blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(175,90%,48%)] opacity-[0.04] blur-[100px] pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <AnimateIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-white/60 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(145,80%,42%)] animate-pulse" />
                Available for opportunities
              </div>
            </AnimateIn>

            <AnimateIn delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
                Building Technology &<br />
                <span className="bg-gradient-to-r from-[hsl(265,85%,68%)] via-[hsl(265,85%,58%)] to-[hsl(175,90%,48%)] bg-clip-text text-transparent">
                  Opportunities
                </span>{" "}for<br />African Artists.
              </h1>
            </AnimateIn>

            <AnimateIn delay={200}>
              <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
                Founder of BAK55 Talent Initiative — a platform empowering artists through competitions, fan engagement, and digital growth.
              </p>
            </AnimateIn>

            <AnimateIn delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={() => scrollTo("projects")} className="bg-white text-[hsl(220,20%,4%)] hover:bg-white/90 rounded-full h-11 px-6 text-sm font-medium gap-2">
                  View My Work <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => scrollTo("contact")} className="border-white/15 text-white/80 hover:bg-white/5 rounded-full h-11 px-6 text-sm font-medium">
                  Contact Me
                </Button>
              </div>
            </AnimateIn>

            <AnimateIn delay={500}>
              <button onClick={() => scrollTo("about")} className="mt-16 text-white/20 hover:text-white/40 transition animate-bounce">
                <ChevronDown className="w-5 h-5" />
              </button>
            </AnimateIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            2. ABOUT
        ═══════════════════════════════════════════ */}
        <section id="about" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <AnimateIn>
                <div className="relative aspect-[3/4] max-w-sm mx-auto md:mx-0 rounded-2xl overflow-hidden">
                  <img src="/portfolio/bith-hero.jpeg" alt="Bith Agustine" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,20%,4%)] via-transparent to-transparent opacity-60" />
                </div>
              </AnimateIn>
              <div>
                <AnimateIn><SectionLabel text="About" /></AnimateIn>
                <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Bith Agustine</h2></AnimateIn>
                <AnimateIn delay={150}>
                  <p className="text-white/50 leading-relaxed mb-4">
                    Bith Agustine is the founder of BAK55 Talent Initiative, a platform designed to empower African artists through competitions, fan engagement, and technology.
                  </p>
                </AnimateIn>
                <AnimateIn delay={200}>
                  <p className="text-white/50 leading-relaxed mb-4">
                    He combines creative storytelling, artist development, and modern web development to build tools that help independent artists grow their careers.
                  </p>
                </AnimateIn>
                <AnimateIn delay={250}>
                  <p className="text-white/50 leading-relaxed">
                    Currently studying Entrepreneurship at <span className="text-white/70 font-medium">ALX Ventures Founder Academy</span>.
                  </p>
                </AnimateIn>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            3. FOUNDER VISION / MISSION
        ═══════════════════════════════════════════ */}
        <section id="mission" className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(265,85%,58%)/3] to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center relative">
            <AnimateIn><SectionLabel text="My Mission" /></AnimateIn>
            <AnimateIn delay={100}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-8">
                Build <span className="bg-gradient-to-r from-[hsl(265,85%,68%)] to-[hsl(175,90%,48%)] bg-clip-text text-transparent">technology</span> and{" "}
                <span className="bg-gradient-to-r from-[hsl(28,100%,58%)] to-[hsl(28,100%,68%)] bg-clip-text text-transparent">community</span> that empower{" "}
                <span className="text-white">African artists</span>.
              </h2>
            </AnimateIn>
            <AnimateIn delay={200}>
              <p className="text-white/45 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                My mission is to build technology and communities that empower African artists to control their careers, grow their audiences, and earn from their creativity.
              </p>
            </AnimateIn>
            <AnimateIn delay={300}>
              <p className="text-white/40 text-base leading-relaxed max-w-2xl mx-auto">
                Through BAK55 Talent Initiative, I am creating a platform where artists can compete, grow their fan base, and build sustainable music careers through digital tools and community support.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            4. PROJECTS
        ═══════════════════════════════════════════ */}
        <section id="projects" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Projects" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">Selected Work</h2></AnimateIn>

            <AnimateIn delay={200}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all duration-500">
                <div className="relative aspect-video bg-gradient-to-br from-[hsl(265,30%,12%)] to-[hsl(220,20%,6%)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-8 left-8 w-64 h-40 rounded-xl bg-[hsl(265,85%,58%)/15] blur-2xl" />
                    <div className="absolute bottom-8 right-8 w-48 h-32 rounded-xl bg-[hsl(175,90%,48%)/10] blur-2xl" />
                  </div>
                  <div className="relative text-center px-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(265,85%,58%)/15] text-[hsl(265,85%,68%)] text-xs font-medium mb-4">
                      <Music className="w-3 h-3" /> Live Platform
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-2">BAK55 Talent Initiative</h3>
                    <p className="text-white/40 text-sm max-w-md mx-auto">Music streaming • Artist competitions • Fan engagement</p>
                  </div>
                </div>
                <div className="p-6 sm:p-8 md:p-10">
                  <p className="text-white/50 leading-relaxed mb-8 max-w-2xl">
                    A digital platform that combines music streaming, artist competitions, and fan engagement systems to help African artists grow their audience and monetize their music.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {FEATURES.map(f => (
                      <span key={f} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/60">{f}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {["React", "TypeScript", "Tailwind CSS", "Supabase", "Edge Functions", "PWA"].map(t => (
                      <span key={t} className="px-3 py-1 rounded-md bg-[hsl(265,85%,58%)/8] text-[hsl(265,85%,68%)] text-xs font-medium">{t}</span>
                    ))}
                  </div>
                  <a href="https://bak55talent.co.ke" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition group/link">
                    Visit bak55talent.co.ke <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            5. CURRENTLY BUILDING
        ═══════════════════════════════════════════ */}
        <section id="building" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Currently Building" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">What I'm Building</h2></AnimateIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BUILDING_CARDS.map((card, i) => (
                <AnimateIn key={card.title} delay={150 + i * 100}>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 hover:border-white/12 hover:bg-white/[0.04] transition-all duration-500 h-full">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${card.color}15` }}>
                      <card.icon className="w-6 h-6" style={{ color: card.color }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{card.desc}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            6. BAK55 ECOSYSTEM MAP
        ═══════════════════════════════════════════ */}
        <section id="ecosystem" className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(265,85%,58%)/2] to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 relative">
            <AnimateIn><SectionLabel text="How It Works" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">The BAK55 Ecosystem</h2></AnimateIn>
            <AnimateIn delay={150}><p className="text-white/40 mb-16 max-w-lg">How artists grow and earn on the BAK55 platform.</p></AnimateIn>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-3">
              {ECOSYSTEM_STEPS.map((step, i) => (
                <AnimateIn key={step.label} delay={200 + i * 80}>
                  <div className="relative flex flex-col items-center text-center group">
                    {/* Connector arrow (hidden on first and on mobile between rows) */}
                    {i > 0 && (
                      <div className="absolute -left-2 sm:-left-1.5 top-7 hidden lg:block">
                        <ArrowRight className="w-3 h-3 text-white/15" />
                      </div>
                    )}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                      style={{ background: `${step.color}12`, boxShadow: `0 0 0 1px ${step.color}20` }}
                    >
                      <step.icon className="w-6 h-6" style={{ color: step.color }} />
                    </div>
                    <p className="text-xs font-medium text-white/60 leading-tight">{step.label}</p>
                    {/* Step number */}
                    <span className="absolute -top-2 -right-1 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ background: step.color, color: "white" }}>
                      {i + 1}
                    </span>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* Flow description */}
            <AnimateIn delay={700}>
              <div className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                <p className="text-sm text-white/45 leading-relaxed max-w-xl mx-auto">
                  Artists upload their music → enter competitions → fans discover and engage → community votes → artists grow their audience → unlock revenue and opportunities.
                </p>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            7. MILESTONES
        ═══════════════════════════════════════════ */}
        <section id="milestones" className="py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Milestones" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">The Journey</h2></AnimateIn>

            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06] hidden sm:block" />
              {MILESTONES.map((m, i) => (
                <AnimateIn key={i} delay={150 + i * 100}>
                  <div className="flex gap-6 pb-10 last:pb-0">
                    <div className="hidden sm:flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[hsl(265,85%,58%)/12] border border-[hsl(265,85%,58%)/25] flex items-center justify-center flex-shrink-0 z-10">
                        <m.icon className="w-4 h-4 text-[hsl(265,85%,68%)]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 font-medium mb-1">{m.year}</p>
                      <h3 className="text-base font-semibold">{m.label}</h3>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            8. SKILLS
        ═══════════════════════════════════════════ */}
        <section id="skills" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Skills" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">What I Do</h2></AnimateIn>

            <div className="grid md:grid-cols-2 gap-8">
              <AnimateIn delay={150}>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(265,85%,58%)/10] flex items-center justify-center">
                      <Code className="w-5 h-5 text-[hsl(265,85%,68%)]" />
                    </div>
                    <h3 className="font-semibold text-lg">Technical</h3>
                  </div>
                  <div className="space-y-3">
                    {TECHNICAL_SKILLS.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 text-white/50">
                        <Icon className="w-4 h-4 text-white/25 flex-shrink-0" />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateIn>
              <AnimateIn delay={250}>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(175,90%,48%)/10] flex items-center justify-center">
                      <Palette className="w-5 h-5 text-[hsl(175,90%,58%)]" />
                    </div>
                    <h3 className="font-semibold text-lg">Creative</h3>
                  </div>
                  <div className="space-y-3">
                    {CREATIVE_SKILLS.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-3 text-white/50">
                        <Icon className="w-4 h-4 text-white/25 flex-shrink-0" />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            9. EXPERIENCE & EDUCATION
        ═══════════════════════════════════════════ */}
        <section id="experience" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Experience" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">Background</h2></AnimateIn>

            <div className="space-y-0 relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06] hidden sm:block" />

              <AnimateIn delay={150}>
                <div className="flex gap-6 pb-12">
                  <div className="hidden sm:flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[hsl(265,85%,58%)/15] border border-[hsl(265,85%,58%)/30] flex items-center justify-center flex-shrink-0 z-10">
                      <Briefcase className="w-4 h-4 text-[hsl(265,85%,68%)]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium mb-1">2025 – Present</p>
                    <h3 className="text-lg font-semibold mb-1">Founder — BAK55 Talent Initiative</h3>
                    <p className="text-sm text-white/45 leading-relaxed max-w-lg">
                      Building a platform and artist ecosystem combining music streaming, competitions, and community-driven discovery to empower African independent artists.
                    </p>
                  </div>
                </div>
              </AnimateIn>

              <AnimateIn delay={250}>
                <div className="flex gap-6 pb-12">
                  <div className="hidden sm:flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 z-10">
                      <Video className="w-4 h-4 text-white/40" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium mb-1">2023 – Present</p>
                    <h3 className="text-lg font-semibold mb-1">Freelance Creative & Video Editor</h3>
                    <p className="text-sm text-white/45 leading-relaxed max-w-lg">
                      Editing music videos, color grading, beat syncing, and visual storytelling for independent artists and brands across East Africa.
                    </p>
                  </div>
                </div>
              </AnimateIn>

              <AnimateIn delay={350}>
                <div className="flex gap-6">
                  <div className="hidden sm:flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[hsl(175,90%,48%)/10] border border-[hsl(175,90%,48%)/20] flex items-center justify-center flex-shrink-0 z-10">
                      <GraduationCap className="w-4 h-4 text-[hsl(175,90%,58%)]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium mb-1">Present</p>
                    <h3 className="text-lg font-semibold mb-1">ALX Ventures Founder Academy</h3>
                    <p className="text-sm text-white/45 leading-relaxed max-w-lg">
                      Entrepreneurship Program — studying venture building, growth strategy, and startup operations.
                    </p>
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            10. CREATIVE WORK SHOWCASE
        ═══════════════════════════════════════════ */}
        <section id="creative" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Creative Work" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">Visual Portfolio</h2></AnimateIn>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {CREATIVE_GALLERY.map((item, i) => (
                <AnimateIn key={i} delay={150 + i * 80}>
                  <button
                    onClick={() => setExpandedImage(item.thumb)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all duration-500"
                  >
                    <img src={item.thumb} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-white/50 capitalize">{item.type}</p>
                      </div>
                    </div>
                  </button>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Lightbox ─── */}
        {expandedImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setExpandedImage(null)}>
            <img src={expandedImage} alt="Creative work" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl font-light">✕</button>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            11. PHILOSOPHY
        ═══════════════════════════════════════════ */}
        <section id="philosophy" className="py-24 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(175,90%,48%)/2] to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <AnimateIn><SectionLabel text="My Philosophy" color="hsl(175,90%,58%)" /></AnimateIn>
            <AnimateIn delay={100}>
              <Heart className="w-8 h-8 mx-auto mb-6 text-[hsl(175,90%,48%)]" />
            </AnimateIn>
            <AnimateIn delay={200}>
              <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-8">
                Technology should create <span className="bg-gradient-to-r from-[hsl(175,90%,48%)] to-[hsl(175,90%,58%)] bg-clip-text text-transparent">opportunities</span>, not barriers.
              </blockquote>
            </AnimateIn>
            <AnimateIn delay={300}>
              <p className="text-white/40 text-base leading-relaxed max-w-xl mx-auto">
                My goal is to build platforms that give African creators the tools they need to grow independently and reach global audiences.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            12. TESTIMONIALS
        ═══════════════════════════════════════════ */}
        <section id="testimonials" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Testimonials" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">What People Say</h2></AnimateIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <AnimateIn key={i} delay={150 + i * 100}>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 h-full flex flex-col">
                    <Quote className="w-6 h-6 text-[hsl(265,85%,58%)/40] mb-4 flex-shrink-0" />
                    <p className="text-sm text-white/55 leading-relaxed mb-6 flex-1 italic">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.avatar}</span>
                      <span className="text-xs font-medium text-white/40">{t.author}</span>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            13. MEDIA & FEATURES
        ═══════════════════════════════════════════ */}
        <section id="media" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn><SectionLabel text="Media & Features" /></AnimateIn>
            <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">In the Spotlight</h2></AnimateIn>

            <div className="grid sm:grid-cols-2 gap-6">
              {MEDIA_ITEMS.map((item, i) => (
                <AnimateIn key={item.title} delay={150 + i * 100}>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex items-start gap-4 hover:border-white/10 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(28,100%,58%)/10] flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[hsl(28,100%,58%)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            14. CTA + CONTACT
        ═══════════════════════════════════════════ */}
        <section id="contact" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            {/* CTA Banner */}
            <AnimateIn>
              <div className="rounded-3xl border border-[hsl(265,85%,58%)/20] bg-gradient-to-br from-[hsl(265,30%,12%)] to-[hsl(220,20%,6%)] p-8 sm:p-12 text-center mb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[hsl(265,85%,58%)] opacity-[0.06] blur-[80px] pointer-events-none" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 relative">Let's Build Something Together</h2>
                <p className="text-white/40 mb-8 max-w-lg mx-auto relative">
                  Whether you're an artist, investor, brand, or fellow builder — I'm always open to exciting collaborations.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
                  <Button onClick={() => scrollTo("contact-form")} className="bg-[hsl(265,85%,58%)] hover:bg-[hsl(265,85%,50%)] text-white rounded-full h-11 px-6 text-sm font-medium gap-2">
                    Contact Me <Send className="w-4 h-4" />
                  </Button>
                  <a href="https://bak55talent.co.ke" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-white/15 text-white/80 hover:bg-white/5 rounded-full h-11 px-6 text-sm font-medium gap-2">
                      View BAK55 <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button onClick={() => scrollTo("contact-form")} variant="outline" className="border-[hsl(175,90%,48%)/30] text-[hsl(175,90%,58%)] hover:bg-[hsl(175,90%,48%)/5] rounded-full h-11 px-6 text-sm font-medium gap-2">
                    Collaborate <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </AnimateIn>

            {/* Contact details + form */}
            <div id="contact-form" className="grid md:grid-cols-2 gap-12 md:gap-20">
              <div>
                <AnimateIn><SectionLabel text="Contact" /></AnimateIn>
                <AnimateIn delay={100}><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Get in Touch</h2></AnimateIn>
                <AnimateIn delay={150}>
                  <p className="text-white/45 leading-relaxed mb-10 max-w-md">
                    Whether you're looking for a developer, creative strategist, or partnership opportunity — I'd love to hear from you.
                  </p>
                </AnimateIn>

                <div className="space-y-5">
                  <AnimateIn delay={200}>
                    <a href="mailto:augustine@bak55talent.co.ke" className="flex items-center gap-4 text-white/50 hover:text-white transition group">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-sm">augustine@bak55talent.co.ke</span>
                    </a>
                  </AnimateIn>
                  <AnimateIn delay={250}>
                    <a href="tel:+254117767163" className="flex items-center gap-4 text-white/50 hover:text-white transition group">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm">+254 117 767 163</span>
                    </a>
                  </AnimateIn>
                  <AnimateIn delay={300}>
                    <a href="https://bak55talent.co.ke" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/50 hover:text-white transition group">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-sm">bak55talent.co.ke</span>
                    </a>
                  </AnimateIn>
                </div>
              </div>

              <AnimateIn delay={200}>
                <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 space-y-5">
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Name</label>
                    <Input value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} placeholder="Your name"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(265,85%,58%)/50] rounded-xl h-11" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Email</label>
                    <Input type="email" value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} placeholder="your@email.com"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(265,85%,58%)/50] rounded-xl h-11" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Message</label>
                    <Textarea value={formData.message} onChange={e => setFormData(d => ({ ...d, message: e.target.value }))} placeholder="Tell me about your project..."
                      rows={4} className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(265,85%,58%)/50] rounded-xl resize-none" />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full bg-[hsl(265,85%,58%)] hover:bg-[hsl(265,85%,50%)] text-white rounded-xl h-11 text-sm font-medium gap-2">
                    {sending ? "Sending..." : <>Send Message <Send className="w-4 h-4" /></>}
                  </Button>
                </form>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
            <span>© {new Date().getFullYear()} Bith Agustine. All rights reserved.</span>
            <span>Built with React & TypeScript</span>
          </div>
        </footer>
      </div>
    </>
  );
}
