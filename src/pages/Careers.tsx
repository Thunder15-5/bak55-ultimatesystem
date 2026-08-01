import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, Heart, Zap, Globe, Music, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEO/SEOHead";

const openPositions = [
  {
    title: "Community Manager — East Africa",
    department: "Growth",
    location: "Nairobi, Kenya",
    type: "Full-time",
    description: "Build and nurture our artist and fan communities across East Africa. You'll be the voice of BAK55 on socials, Discord, and WhatsApp groups.",
  },
  {
    title: "Music A&R Scout",
    department: "Content",
    location: "Remote — Africa",
    type: "Contract",
    description: "Discover and onboard emerging talent across the continent. Listen, curate, and help artists shine on the platform.",
  },
  {
    title: "Frontend Engineer (React)",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Ship features used every day by the artists and fans on BAK55. React, TypeScript, Tailwind — you know the stack.",
  },
  {
    title: "Content Creator & Storyteller",
    department: "Marketing",
    location: "Remote — Africa",
    type: "Part-time",
    description: "Create compelling stories about African music, our artists, and the BAK55 mission. Blog posts, reels, and short-form video.",
  },
];

const values = [
  { icon: Music, title: "Music First", description: "Every decision starts with the artist. We exist to amplify African talent." },
  { icon: Zap, title: "Move Fast", description: "Ship weekly, learn daily. We're building the future of African music — speed matters." },
  { icon: Heart, title: "Community Over Clout", description: "Real impact over vanity metrics. We measure success by lives changed." },
  { icon: Globe, title: "Pan-African Vision", description: "From Nairobi to Lagos, Cape Town to Accra — we think continent-wide." },
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Careers at BAK55 Talent"
        description="Join the team building Africa's premier music platform. We're hiring passionate people who believe in African talent."
        url="/careers"
      />
      <Navigation />

      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Briefcase className="w-3 h-3 mr-1" /> We're Hiring
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Build the Future of{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              African Music
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            BAK55 Talent is on a mission to give every African artist a fair shot. 
            Join a small, early-stage team where your work reaches artists across the continent.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="bg-card/50 border-primary/10 text-center">
                <CardContent className="pt-6">
                  <v.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Open Positions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {openPositions.map((pos) => (
              <Card key={pos.title} className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg">{pos.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{pos.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{pos.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pos.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pos.type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center max-w-2xl mx-auto mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="py-10">
              <Users className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Don't See Your Role?</h2>
              <p className="text-muted-foreground mb-6">
                We're always looking for talented people who are passionate about African music. Send us a message and tell us how you'd contribute.
              </p>
              <Link to="/contact">
                <Button variant="default" size="lg">Get In Touch</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
