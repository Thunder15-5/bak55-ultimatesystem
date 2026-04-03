import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const CTA = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20 p-8 sm:p-12 md:p-16 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Start Your Journey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight">
            Your Music Career
            <br />
            <span className="text-gradient">Starts Here</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Join hundreds of African artists already uploading music, winning competitions, and earning real money on BAK55.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="group shadow-xl w-full sm:w-auto">
                <Music className="w-5 h-5 mr-2" />
                Join Free Today
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="glass" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Free to join · No credit card required · Cash out via M-Pesa
          </p>
        </div>
      </div>
    </section>
  );
};
