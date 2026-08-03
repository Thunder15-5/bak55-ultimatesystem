import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { JourneyTimeline } from "@/components/JourneyTimeline";
import { LiveStatsRow } from "@/components/LiveStatsRow";

/**
 * Press & Media.
 * Only verifiable facts belong on this page: what BAK55 is, where it is based,
 * what stage it is at, and live platform numbers. No press mentions, awards,
 * partnerships or coverage are listed unless they have actually happened.
 */
const PressKit = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="px-4 pb-20 pt-28">
        <div className="container mx-auto max-w-3xl space-y-10">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold md:text-5xl">
              Press & <span className="text-gradient">Media</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              BAK55 is an early-stage platform built in Nairobi. This page holds the facts,
              the numbers and the assets — nothing more.
            </p>
          </header>

          <Card className="space-y-4 border-primary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <h2 className="text-2xl font-bold">What BAK55 is</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">BAK55</strong> is a music platform for African
                artists that combines streaming, competitions with fan voting, direct fan support and
                payouts, built around an in-app credit called BAKCoins (1 BAKCoin = $0.16).
              </p>
              <p>
                It exists because the economics of global streaming do not work for an artist in
                Nairobi. On BAK55 a fan can support an artist directly, and the platform's cut is
                disclosed before every transaction.
              </p>
              <p>
                We are in open beta. We are not a distributor, we do not have a large catalog, and we
                have not yet completed a full competition season. Anything we claim publicly is
                either shown live from our database or dated in our{" "}
                <Link to="/changelog" className="text-primary underline underline-offset-2">
                  public changelog
                </Link>
                .
              </p>
            </div>
          </Card>

          <Card className="space-y-6 border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-6 md:p-10">
            <h2 className="text-center text-2xl font-bold">Platform numbers, live</h2>
            <LiveStatsRow />
            <p className="text-center text-xs text-muted-foreground">
              Pulled from our production database when this page loads. We do not round up.
            </p>
          </Card>

          <Card className="space-y-6 border-primary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <h2 className="text-2xl font-bold">Key facts</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Founded</div>
                <div className="text-lg font-bold">2025</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Headquarters</div>
                <div className="text-lg font-bold">Nairobi, Kenya</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Public beta opened</div>
                <div className="text-lg font-bold">7 October 2025</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">First competition</div>
                <div className="text-lg font-bold">9 February 2026</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Stage</div>
                <div className="text-lg font-bold">Open beta, self-funded</div>
              </div>
              <div>
                <div className="mb-1 text-sm text-muted-foreground">Platform credit</div>
                <div className="text-lg font-bold">1 BAKCoin = $0.16</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              We do not publish third-party market projections as BAK55 traction. Every figure on
              this site is read live from our own database.
            </p>

          </Card>

          <JourneyTimeline />

          <Card className="space-y-4 border-primary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <h2 className="text-2xl font-bold">Assets</h2>
            <p className="text-sm text-muted-foreground">
              Only assets that actually exist are listed. For anything else, email us and we will send
              it directly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = "/bak55-logo.png";
                  a.download = "bak55-logo.png";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download logo (PNG)
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:press@bak55talent.co.ke?subject=BAK55%20press%20assets">
                  <Mail className="mr-2 h-4 w-4" />
                  Request other assets
                </a>
              </Button>
            </div>
          </Card>

          <Card className="border-primary/10 bg-card/50 p-6 backdrop-blur-sm md:p-10">
            <h2 className="mb-4 text-2xl font-bold">Boilerplate</h2>
            <p className="italic leading-relaxed text-muted-foreground">
              BAK55 is a Nairobi-based music platform for African artists, combining streaming,
              competitions with fan voting, and direct fan support through an in-app credit called
              BAKCoins. Founded in 2025 and in open beta since October 2025, BAK55 publishes its fee
              splits before every transaction, its competition scoring rules in full, and a public
              changelog of every release. The platform is early-stage and says so.
            </p>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-6 text-center md:p-10">
            <h2 className="mb-4 text-2xl font-bold">Media enquiries</h2>
            <p className="text-lg">
              <strong>press@bak55talent.co.ke</strong>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Interviews, founder comment, screenshots or data — we will answer with specifics or say
              we do not know.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Instagram @bak55.talent · Twitter @Bak55Official
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PressKit;
