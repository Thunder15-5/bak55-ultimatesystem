import { Card } from "@/components/ui/card";
import { Trophy, Users, Mic, Music, Award, Star } from "lucide-react";

const stages = [
  {
    number: 1,
    name: "Application & Selection",
    participants: "55 Artists Selected",
    description: "Submit your application. Top 55 founding artists chosen to begin the journey.",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: 2,
    name: "Mini Edition 1",
    participants: "55 → 45 Artists",
    description: "First qualifying round. Prove your skills, build your fanbase, and survive elimination.",
    icon: Mic,
    color: "from-purple-500 to-pink-500",
  },
  {
    number: 3,
    name: "Mini Edition 2",
    participants: "45 → 35 Artists",
    description: "Second qualifying round. Competition intensifies as the field narrows.",
    icon: Music,
    color: "from-indigo-500 to-purple-500",
  },
  {
    number: 4,
    name: "Mini Edition 3",
    participants: "35 → 25 Artists",
    description: "Final qualifying round. Only the most dedicated artists advance to the studio.",
    icon: Star,
    color: "from-pink-500 to-rose-500",
  },
  {
    number: 5,
    name: "Studio Round",
    participants: "25 → 15 Artists",
    description: "Top 25 get professional studio sessions. Record your best work with industry producers.",
    icon: Music,
    color: "from-orange-500 to-red-500",
  },
  {
    number: 6,
    name: "Semi-Finals",
    participants: "15 → 5 Artists",
    description: "The elite 15 compete. Fans and judges decide who reaches the Grand Finale.",
    icon: Award,
    color: "from-yellow-500 to-orange-500",
  },
  {
    number: 7,
    name: "Grand Finale",
    participants: "5 → 1 Winner",
    description: "The final 5 battle for the crown. Live performances, massive prizes, and industry recognition.",
    icon: Trophy,
    color: "from-yellow-500 to-amber-500",
  },
];

export const FoundersSeason = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-card/30 to-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Founders Season
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            The <span className="text-gradient">7-Phase Journey</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From 55 founding artists to 1 champion. Experience the ultimate talent competition 
            designed to launch your music career.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line connecting stages */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent hidden sm:block" />

          {/* Stages */}
          <div className="space-y-8">
            {stages.map((stage, index) => (
              <div
                key={stage.number}
                className={`relative flex items-center gap-6 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Stage number badge */}
                <div className="relative z-10 shrink-0">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${stage.color} flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg border-4 border-background`}>
                    {stage.number}
                  </div>
                </div>

                {/* Stage content card */}
                <Card className={`flex-1 p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 ${
                  index % 2 === 0 ? 'md:mr-auto md:ml-6' : 'md:ml-auto md:mr-6'
                } max-w-lg`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center shrink-0`}>
                      <stage.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{stage.name}</h3>
                      <p className="text-sm text-primary font-semibold mb-2">{stage.participants}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            Applications for Founders Season are now open
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/apply" className="inline-block">
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Apply Now
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};