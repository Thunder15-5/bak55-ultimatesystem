import { AlertCircle, TrendingDown, Lock, Eye } from "lucide-react";

const Problem = () => {
  const problems = [
    {
      icon: TrendingDown,
      title: "Artist Exploitation",
      description: "92% of African artists earn under $100/month despite industry growth",
      stat: "$100/mo"
    },
    {
      icon: Lock,
      title: "Ownership Theft",
      description: "Labels claim 50-80% of masters and publishing rights",
      stat: "50-80%"
    },
    {
      icon: AlertCircle,
      title: "Access Barriers",
      description: "Professional production costs 6-12 months of average income",
      stat: "6-12 mo"
    },
    {
      icon: Eye,
      title: "Data Darkness",
      description: "Artists operate blindly without audience insights",
      stat: "0 insights"
    }
  ];

  return (
    <section className="py-24 px-4 relative">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            The Problem: <span className="bg-gradient-secondary bg-clip-text text-transparent">Systemic Failure</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            African artists create value but remain systematically exploited by a broken industry structure
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
              >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="mb-2 text-2xl font-bold text-destructive">
                  {problem.stat}
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {problem.title}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  {problem.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-destructive/20 text-center">
          <p className="text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">The result?</span> Artists create billions in value but can't pay rent. It's time to rebuild the system.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;
