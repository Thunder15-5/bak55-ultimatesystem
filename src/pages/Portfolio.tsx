import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Globe, ArrowRight, ExternalLink, ChevronDown, Send, Code, Palette, Music, Video, Megaphone, Users, Sparkles, GraduationCap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEO/SEOHead";

// Intersection Observer hook for scroll animations
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

const FEATURES = [
  "Artist music uploads",
  "Competition system",
  "Fan voting",
  "Community discovery",
  "Artist growth tools",
];

export default function Portfolio() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill all fields");
      return;
    }
    setSending(true);
    // Simulate send
    await new Promise(r => setTimeout(r, 1200));
    toast.success("Message sent! I'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
    setSending(false);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <SEOHead
        title="Bith Agustine — Entrepreneur, Developer, Creative Strategist"
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
            <div className="hidden md:flex items-center gap-8 text-xs font-medium text-white/50">
              {["About", "Projects", "Skills", "Experience", "Contact"].map(s => (
                <button key={s} onClick={() => scrollTo(s.toLowerCase())} className="hover:text-white transition">{s}</button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => scrollTo("contact")}
              className="bg-[hsl(265,85%,58%)] hover:bg-[hsl(265,85%,50%)] text-white text-xs h-8 px-4 rounded-full"
            >
              Get in Touch
            </Button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section id="hero" className="relative min-h-[100dvh] flex items-center justify-center pt-14">
          {/* Gradient orbs */}
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
                </span>{" "}
                for<br />African Artists.
              </h1>
            </AnimateIn>

            <AnimateIn delay={200}>
              <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
                Founder of BAK55 Talent Initiative — a platform empowering artists through competitions, fan engagement, and digital growth.
              </p>
            </AnimateIn>

            <AnimateIn delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => scrollTo("projects")}
                  className="bg-white text-[hsl(220,20%,4%)] hover:bg-white/90 rounded-full h-11 px-6 text-sm font-medium gap-2"
                >
                  View My Work <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => scrollTo("contact")}
                  className="border-white/15 text-white/80 hover:bg-white/5 rounded-full h-11 px-6 text-sm font-medium"
                >
                  Contact Me
                </Button>
              </div>
            </AnimateIn>

            <AnimateIn delay={500}>
              <button
                onClick={() => scrollTo("about")}
                className="mt-16 text-white/20 hover:text-white/40 transition animate-bounce"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </AnimateIn>
          </div>
        </section>

        {/* ─── ABOUT ─── */}
        <section id="about" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <AnimateIn>
                <div className="relative aspect-[3/4] max-w-sm mx-auto md:mx-0 rounded-2xl overflow-hidden">
                  <img
                    src="/portfolio/bith-hero.jpeg"
                    alt="Bith Agustine"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,20%,4%)] via-transparent to-transparent opacity-60" />
                </div>
              </AnimateIn>

              <div>
                <AnimateIn>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(265,85%,68%)] mb-4">About</p>
                </AnimateIn>
                <AnimateIn delay={100}>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Bith Agustine</h2>
                </AnimateIn>
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

        {/* ─── PROJECTS ─── */}
        <section id="projects" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(265,85%,68%)] mb-4">Projects</p>
            </AnimateIn>
            <AnimateIn delay={100}>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">Selected Work</h2>
            </AnimateIn>

            <AnimateIn delay={200}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all duration-500">
                {/* Project screenshot area */}
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

                {/* Project details */}
                <div className="p-6 sm:p-8 md:p-10">
                  <p className="text-white/50 leading-relaxed mb-8 max-w-2xl">
                    A digital platform that combines music streaming, artist competitions, and fan engagement systems to help African artists grow their audience and monetize their music.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {FEATURES.map(f => (
                      <span key={f} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/60">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {["React", "TypeScript", "Tailwind CSS", "Supabase", "Edge Functions", "PWA"].map(t => (
                      <span key={t} className="px-3 py-1 rounded-md bg-[hsl(265,85%,58%)/8] text-[hsl(265,85%,68%)] text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>

                  <a
                    href="https://bak55talent.co.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition group/link"
                  >
                    Visit bak55talent.co.ke <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ─── SKILLS ─── */}
        <section id="skills" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(265,85%,68%)] mb-4">Skills</p>
            </AnimateIn>
            <AnimateIn delay={100}>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">What I Do</h2>
            </AnimateIn>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Technical */}
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

              {/* Creative */}
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

        {/* ─── EXPERIENCE & EDUCATION ─── */}
        <section id="experience" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <AnimateIn>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(265,85%,68%)] mb-4">Experience</p>
            </AnimateIn>
            <AnimateIn delay={100}>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">Background</h2>
            </AnimateIn>

            <div className="space-y-0 relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06] hidden sm:block" />

              {/* Item 1 */}
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

              {/* Item 2 */}
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

              {/* Education */}
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

        {/* ─── CONTACT ─── */}
        <section id="contact" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20">
              <div>
                <AnimateIn>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(265,85%,68%)] mb-4">Contact</p>
                </AnimateIn>
                <AnimateIn delay={100}>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Let's Work Together</h2>
                </AnimateIn>
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

              {/* Contact form */}
              <AnimateIn delay={200}>
                <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 space-y-5">
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Name</label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                      placeholder="Your name"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(265,85%,58%)/50] rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(265,85%,58%)/50] rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
                      placeholder="Tell me about your project..."
                      rows={4}
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(265,85%,58%)/50] rounded-xl resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[hsl(265,85%,58%)] hover:bg-[hsl(265,85%,50%)] text-white rounded-xl h-11 text-sm font-medium gap-2"
                  >
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
