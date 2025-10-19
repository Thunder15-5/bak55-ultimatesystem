import { Card } from "@/components/ui/card";
import { Quote, Star, Users, Music, DollarSign, TrendingUp } from "lucide-react";

const testimonials = [
  {
    quote: "BAK55 gave me the platform to showcase my talent and actually earn from my music. The AI feedback helped me improve my craft!",
    author: "DJ Kevo",
    role: "Afrobeat Artist",
    achievement: "Won 1st Prize in Hip Hop Challenge",
  },
  {
    quote: "Finally, a platform that values African artists. The transparent earnings and fair judging make all the difference.",
    author: "Amina Juma",
    role: "R&B Singer",
    achievement: "200K+ Streams in 3 months",
  },
  {
    quote: "As a brand, BAK55 connects us with emerging talent and gives us real engagement metrics. Perfect partnership platform.",
    author: "SafariCom Music",
    role: "Brand Partner",
    achievement: "Sponsored 5 competitions",
  },
];

const metrics = [
  { icon: Users, value: "5K+", label: "Active Users" },
  { icon: Music, value: "2K+", label: "Tracks Uploaded" },
  { icon: DollarSign, value: "KSh 2.5M", label: "Paid to Artists" },
  { icon: TrendingUp, value: "15M+", label: "Total Streams" },
];

export const SocialProof = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
            <Star className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-secondary">Trusted by Artists</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
            Join Thousands Building Their <br className="hidden sm:block" />
            <span className="text-gradient">Music Careers</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real artists, real earnings, real impact on the African music industry
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="group p-6 bg-card/60 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-2xl"
            >
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-primary/40 group-hover:text-primary/60 transition-colors" />
                
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="pt-4 border-t border-primary/10">
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    <Star className="w-3 h-3" />
                    {testimonial.achievement}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {metrics.map((metric, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
