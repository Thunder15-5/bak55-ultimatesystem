import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  "Founding artist status with lifetime benefits",
  "Early access to all AI tools and features",
  "Priority support and community building",
  "First shot at major competitions and prizes",
];

export const CTA = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('early_access_signups')
        .insert({ email, source: 'homepage_cta' });

      if (dbError) {
        if (dbError.code === '23505') {
          toast.info("You're already on the list!", {
            description: "We'll notify you when we launch."
          });
          setEmail("");
          return;
        }
        throw dbError;
      }

      // Send notification email to admin
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'admin@bak55talent.co.ke',
          subject: '🎯 New Early Access Signup',
          template: 'contact_form',
          data: {
            name: 'Early Access User',
            email,
            subject: 'New Early Access Signup',
            message: `New early access signup from homepage CTA at ${new Date().toLocaleString()}`
          }
        }
      });

      toast.success("Thanks! We'll be in touch soon.", {
        description: "Your early access request has been received."
      });
      setEmail("");
    } catch (error: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20 p-8 sm:p-12 md:p-16 shadow-2xl animate-fade-in-up">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">Join the 100 Artist Alliance</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
                Be Among the First
                <br />
                <span className="text-gradient">Shape African Music's Future</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join our exclusive founding artist program. Limited to 100 artists in Kenya for our MVP launch.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 bg-background/50 border-primary/20 focus:border-primary"
                  required
                />
                <Button type="submit" variant="hero" size="lg" className="group h-12 whitespace-nowrap" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Get Early Access"}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                No credit card required · Launching Q1 2026 · 100% free during beta
              </p>
            </form>

            {/* Trust */}
            <div className="pt-8 border-t border-primary/10">
              <div className="flex flex-wrap justify-center gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">$50K</div>
                  <div className="text-xs text-muted-foreground">Pre-seed Funding</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">KSh 38.75M</div>
                  <div className="text-xs text-muted-foreground">Year 3 Revenue Target</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">40%+</div>
                  <div className="text-xs text-muted-foreground">Projected Margins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
