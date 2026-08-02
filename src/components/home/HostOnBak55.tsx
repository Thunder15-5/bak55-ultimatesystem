import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Trophy, Wallet, Users, ArrowRight, ShieldCheck } from "lucide-react";

const benefits = [
  { icon: Trophy, title: "Launch in minutes", text: "A guided builder handles entries, schedule, judging and prizes." },
  { icon: Users, title: "Bring your own audience", text: "Contestants and fans register, submit and vote in one place." },
  { icon: Wallet, title: "Transparent revenue", text: "Configurable splits on entry fees and paid voting, settled to your wallet." },
  { icon: ShieldCheck, title: "Fraud protection built in", text: "Vote integrity checks, audit trails and moderation tools included." },
];

export function HostOnBak55() {
  return (
    <section className="py-12 md:py-20 px-4 border-y border-border/30 bg-card/20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
              <Building2 className="w-4 h-4" /> For organizers
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
              Run your competition on <span className="text-gradient">BAK55</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Studios, record labels, producers, brands, universities, NGOs, agencies, festivals and event organizers use
              BAK55 to create, manage and monetize talent competitions — with our technology, your brand.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="hero" asChild><Link to="/organizer/setup">Become an organizer</Link></Button>
              <Button variant="outline" asChild>
                <Link to="/organizers">See verified organizers <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <Card key={b.title} className="bg-background/40">
                <CardContent className="p-5 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <b.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
