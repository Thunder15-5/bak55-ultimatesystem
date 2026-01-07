import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Mic, Music, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const currentStage = 0; // First stage - Application

  return (
    <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-card/30 to-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Founders Season
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            The <span className="text-gradient">7-Phase Journey</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            From 55 founding artists to 1 champion. Experience the ultimate talent competition 
            designed to launch your music career.
          </p>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="lg:hidden space-y-3">
          {stages.map((stage, index) => {
            const isComplete = index < currentStage;
            const isCurrent = index === currentStage;
            const IconComponent = stage.icon;
            
            return (
              <div
                key={stage.number}
                className={cn(
                  "flex items-start gap-3 p-3 sm:p-4 rounded-xl border transition-all",
                  isComplete && "bg-primary/10 border-primary/30",
                  isCurrent && "bg-secondary/10 border-secondary ring-2 ring-secondary/50",
                  !isComplete && !isCurrent && "bg-muted/30 border-border opacity-70"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
                  isComplete && "bg-primary text-primary-foreground",
                  isCurrent && "bg-secondary text-secondary-foreground",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}>
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm sm:text-base">{stage.name}</span>
                    {isCurrent && <Badge className="text-xs bg-secondary">Current</Badge>}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">{stage.participants}</Badge>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Horizontal timeline */}
        <div className="hidden lg:block relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-border z-0">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
              style={{ width: `${(currentStage / stages.length) * 100}%` }}
            />
          </div>

          <div className="flex justify-between relative z-10">
            {stages.map((stage, index) => {
              const isComplete = index < currentStage;
              const isCurrent = index === currentStage;
              const IconComponent = stage.icon;
              
              return (
                <div
                  key={stage.number}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                      isComplete && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "bg-secondary border-secondary text-secondary-foreground ring-4 ring-secondary/30",
                      !isComplete && !isCurrent && "bg-muted border-border text-muted-foreground group-hover:border-primary/50"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    isCurrent && "text-secondary",
                    isComplete && "text-primary"
                  )}>
                    {stage.name}
                  </span>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {stage.participants}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
