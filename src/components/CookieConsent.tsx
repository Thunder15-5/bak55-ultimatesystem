import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "bak55_cookie_consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card/95 backdrop-blur-xl border border-primary/20 rounded-xl p-4 md:p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
              <Cookie className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg">Cookie Preferences</h3>
                <button
                  onClick={handleDecline}
                  className="sm:hidden p-1 hover:bg-muted rounded-full"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                By clicking "Accept All", you consent to our use of cookies. Read our{" "}
                <Link to="/cookies" className="text-primary hover:underline font-medium">
                  Cookie Policy
                </Link>{" "}
                to learn more.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  onClick={handleAccept}
                  variant="hero"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Accept All
                </Button>
                <Button 
                  onClick={handleDecline}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Essential Only
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
