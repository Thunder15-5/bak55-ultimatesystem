import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, Music } from "lucide-react";
import { toast } from "sonner";

const PressKit = () => {
  const handleDownload = (assetName: string) => {
    toast.info(`${assetName} download will be available soon. Contact press@bak55talent.co.ke for immediate access.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              Press <span className="text-gradient">Kit</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Media resources and company information
            </p>
          </div>

          {/* Company Overview */}
          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10 mb-12">
            <h2 className="text-3xl font-bold mb-6">Company Overview</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">BAK55</strong> is building the essential infrastructure for African music's digital future—an AI-powered talent ecosystem that discovers, develops, and monetizes artists through a proprietary digital economy.
              </p>
              <p>
                We solve the fundamental brokenness in the African music industry where artists create value but remain systematically exploited. Our platform combines streaming, competitions, live events, and AI tools in a circular economy powered by BAKCoins.
              </p>
              <p>
                Starting with Kenya, we're scaling across East Africa using a hybrid digital-physical strategy, providing African artists with fair compensation, professional tools, and sustainable career pathways.
              </p>
            </div>
          </Card>

          {/* Key Facts */}
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Key Facts & Figures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Founded</div>
                <div className="text-xl font-bold">2025</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Headquarters</div>
                <div className="text-xl font-bold">Nairobi, Kenya</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Market Size</div>
                <div className="text-xl font-bold">$110M Sub-Saharan Africa</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Market Growth</div>
                <div className="text-xl font-bold">22.6% YoY (Fastest Globally)</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Launch Date</div>
                <div className="text-xl font-bold">Q1 2026</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Funding Stage</div>
                <div className="text-xl font-bold">Pre-Seed ($50K)</div>
              </div>
            </div>
          </Card>

          {/* Downloads */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold">Download Assets</h2>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Company Fact Sheet</h3>
                    <p className="text-sm text-muted-foreground">PDF, 2 pages</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload("Company Fact Sheet")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/10 hover:border-secondary/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Logo Pack</h3>
                    <p className="text-sm text-muted-foreground">PNG, SVG - Multiple variations</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload("Logo Pack")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-accent/10 hover:border-accent/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Founder Photos</h3>
                    <p className="text-sm text-muted-foreground">High-resolution JPG</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload("Founder Photos")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>
          </div>

          {/* Boilerplate */}
          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10 mb-12">
            <h2 className="text-3xl font-bold mb-6">Boilerplate</h2>
            <p className="text-muted-foreground italic leading-relaxed">
              BAK55 is an AI-powered talent economy for African music that combines streaming, competitions, and digital currency to create fair pathways for artist success. Founded in 2025 and launching in Kenya, BAK55 addresses the systematic exploitation in the $110 million Sub-Saharan African recorded music industry—the fastest-growing market globally at 22.6% YoY. The platform provides transparent earnings, professional AI tools, and community-driven discovery. The BAKCoins economy enables artists to earn through streaming, competitions, tips, and platform contributions—all convertible to cash. With a vision to scale across Africa, BAK55 is building the essential infrastructure for the next generation of African artists.
            </p>
          </Card>

          {/* Contact */}
          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">Media Inquiries</h2>
              <div className="space-y-2">
                <p className="text-lg">
                  <strong>Press Contact:</strong> press@bak55talent.co.ke
                </p>
                <p className="text-muted-foreground">
                  For interviews, high-resolution assets, or additional information
                </p>
              </div>
              <div className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Follow us: Twitter @BAK55talent · Instagram @bak55.talent · LinkedIn /company/bak55
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PressKit;