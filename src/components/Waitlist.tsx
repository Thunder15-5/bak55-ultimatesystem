import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"artist" | "fan" | "">("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !role) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // In real implementation, this would call an API
    toast({
      title: "You're on the list! 🎉",
      description: "We'll notify you when BAK55 launches",
    });

    setEmail("");
    setName("");
    setRole("");
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      
      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Join the <span className="bg-gradient-primary bg-clip-text text-transparent">Waitlist</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Be among the first 100 founding members. Get lifetime benefits and shape the future of African music.
          </p>
        </div>

        <div className="p-8 md:p-12 rounded-3xl bg-card/80 backdrop-blur-sm border border-border shadow-glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                I'm joining as
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("artist")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "artist"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background/50 hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-2">🎤</div>
                  <div className="font-medium text-foreground">Artist</div>
                  <div className="text-xs text-muted-foreground">Build my career</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setRole("fan")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "fan"
                      ? "border-secondary bg-secondary/10"
                      : "border-border bg-background/50 hover:border-secondary/50"
                  }`}
                >
                  <div className="text-2xl mb-2">🎧</div>
                  <div className="font-medium text-foreground">Fan</div>
                  <div className="text-xs text-muted-foreground">Discover talent</div>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-glow-strong transition-all"
            >
              Join Waitlist
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">100</div>
                <div className="text-xs text-muted-foreground">Founding spots</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">Free</div>
                <div className="text-xs text-muted-foreground">Lifetime Pro</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">Q1 2026</div>
                <div className="text-xs text-muted-foreground">Launch date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
