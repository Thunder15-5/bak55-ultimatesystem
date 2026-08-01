import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { LiveStatsRow } from "@/components/LiveStatsRow";
import { JourneyTimeline } from "@/components/JourneyTimeline";

/**
 * Success Stories.
 * We have not yet completed a full competition season, so there are no finished
 * artist success stories to tell. This page says that plainly and shows the real
 * state of the platform instead of inventing outcomes.
 */
const SuccessStories = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="px-4 pb-20 pt-28">
        <div className="container mx-auto max-w-3xl space-y-10">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold md:text-6xl">
              Success <span className="text-gradient">Stories</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We are early. Rather than invent stories, we are showing you exactly where we are.
            </p>
          </header>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-12">
            <div className="space-y-6 text-center">
              <Quote className="mx-auto h-10 w-10 text-primary" />
              <p className="text-xl font-medium leading-relaxed md:text-2xl">
                "We're just getting started, but our vision is clear: create pathways to success for
                African artists who've been locked out of opportunity."
              </p>
              <div className="pt-2">
                <p className="text-lg font-bold">Bith Agustine A.</p>
                <p className="text-muted-foreground">Founder, BAK55</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-6 border-primary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <div>
              <h2 className="text-2xl font-bold">Where the platform stands today</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live counts from our database, not targets.
              </p>
            </div>
            <LiveStatsRow />
          </Card>

          <Card className="space-y-4 border-secondary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <h2 className="text-2xl font-bold">Why there are no stories here yet</h2>
            <p className="text-muted-foreground">
              A success story means an artist earned something meaningful, or reached an audience they
              could not reach before, and can say so in their own words. That takes a full
              competition season and real payouts behind it. We have run our first competition and
              our first payouts; we have not yet run enough of either to claim outcomes.
            </p>
            <p className="text-muted-foreground">
              When an artist does have a story, it will appear here with their name, their words and
              the date — and only with their permission. Nothing on this page will ever be written on
              an artist's behalf.
            </p>
            <div className="pt-2">
              <Button variant="outline" asChild>
                <Link to="/changelog">See what we have actually shipped</Link>
              </Button>
            </div>
          </Card>

          <JourneyTimeline />

          <Card className="space-y-4 border-secondary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <h2 className="text-2xl font-bold">The Founding Artists</h2>
            <p className="text-muted-foreground">
              Artists who join during beta shape what gets built. That is the offer, and it is the
              whole offer:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• A founding artist badge on your profile</li>
              <li>• Early access to new features before general release</li>
              <li>• A direct line to the team, and your bug reports prioritised</li>
              <li>• Input on what we build next</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              We are not promising audience size, income or exposure. Those depend on the work.
            </p>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-primary/10 p-6 text-center sm:p-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold md:text-3xl">Be early</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Join while the platform is still small enough that your feedback changes it.
              </p>
              <Link to="/join" className="inline-block w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Join as an Artist
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SuccessStories;
