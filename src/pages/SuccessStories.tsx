import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote } from "lucide-react";
import { Link } from "react-router-dom";

const SuccessStories = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              Success <span className="text-gradient">Stories</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Real artists building real careers on BAK55
            </p>
          </div>

          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 mb-12">
            <div className="text-center space-y-6">
              <Quote className="w-12 h-12 text-primary mx-auto" />
              <p className="text-2xl font-medium leading-relaxed">
                "We're just getting started, but our vision is clear: create pathways to success for African artists who've been locked out of opportunity."
              </p>
              <div className="pt-4">
                <p className="font-bold text-lg">Atem Bith Madut</p>
                <p className="text-muted-foreground">Founder & CEO, BAK55</p>
              </div>
            </div>
          </Card>

          <div className="space-y-12">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
              <h2 className="text-3xl font-bold mb-6">Our Track Record</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-gradient-primary">3</div>
                  <p className="text-muted-foreground">Artists reached Top 100 on Boomplay under our management</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-gradient-secondary">12</div>
                  <p className="text-muted-foreground">Live events organized with 500+ average attendance</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-accent">50+</div>
                  <p className="text-muted-foreground">Industry connections including A&Rs at major labels</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-gradient-primary">5</div>
                  <p className="text-muted-foreground">Years of artist management experience</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm border-secondary/10">
              <h2 className="text-3xl font-bold mb-6">The Founding 100</h2>
              <p className="text-lg text-muted-foreground mb-6">
                We're building BAK55 with a select group of founding artists who believe in our vision. These pioneers will shape the platform and enjoy lifetime benefits.
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-bold mb-2">What Founding Artists Get:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Lifetime founding artist status badge</li>
                    <li>• Priority access to all new features and AI tools</li>
                    <li>• Exclusive direct line to the founding team</li>
                    <li>• Input on platform development and features</li>
                    <li>• Bonus BAKCoins package to kickstart earnings</li>
                    <li>• Featured in launch marketing and success stories</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-12 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold">Your Success Story Starts Here</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join the movement to build a fairer music industry. Be part of the first wave of artists who prove that sustainable careers are possible without exploitation.
                </p>
                <Link to="/join">
                  <Button variant="hero" size="xl">
                    Become a Founding Artist
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="text-center pt-8">
              <p className="text-muted-foreground">
                Success stories will be updated regularly as our community grows.
                <br />
                Follow our journey and be inspired by artists building their dreams on BAK55.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SuccessStories;
