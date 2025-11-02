import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Music } from "lucide-react";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-6 glassmorphism border-border/50">
        {/* 404 Number with gradient */}
        <div className="space-y-2">
          <h1 className="text-8xl md:text-9xl font-bold text-gradient animate-fade-in">
            404
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-hero rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="space-y-3 animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
          {location.pathname && (
            <p className="text-sm text-muted-foreground/70 font-mono bg-muted/30 px-4 py-2 rounded-lg inline-block">
              {location.pathname}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 animate-fade-in-up">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/catalog">
              <Music className="h-4 w-4" />
              Browse Music
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <Link to="/competitions" className="text-primary hover:text-primary-glow transition-colors">
              Competitions
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/about" className="text-primary hover:text-primary-glow transition-colors">
              About Us
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/support" className="text-primary hover:text-primary-glow transition-colors">
              Support
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/contact" className="text-primary hover:text-primary-glow transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
