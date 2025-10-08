import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { FileText, Shield, Scale } from "lucide-react";
import { Link } from "react-router-dom";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              Legal <span className="text-gradient">Information</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Important legal documents and policies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link to="/privacy">
              <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all cursor-pointer h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Privacy Policy</h3>
                <p className="text-sm text-muted-foreground">
                  How we collect, use, and protect your data
                </p>
              </Card>
            </Link>

            <Link to="/terms">
              <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-secondary/10 hover:border-secondary/30 transition-all cursor-pointer h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Terms of Service</h3>
                <p className="text-sm text-muted-foreground">
                  Rules and conditions for using BAK55
                </p>
              </Card>
            </Link>

            <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-accent/10 h-full">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-4">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Cookie Policy</h3>
              <p className="text-sm text-muted-foreground">
                Coming soon
              </p>
            </Card>
          </div>

          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10 mb-12">
            <h2 className="text-3xl font-bold mb-6">Legal Entity Information</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex justify-between border-b border-primary/10 pb-3">
                <span className="font-semibold">Company Name:</span>
                <span>BAK55 Talent Limited</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-3">
                <span className="font-semibold">Registered Address:</span>
                <span>Nairobi, Kenya</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-3">
                <span className="font-semibold">Founded:</span>
                <span>2025</span>
              </div>
              <div className="flex justify-between border-b border-primary/10 pb-3">
                <span className="font-semibold">Jurisdiction:</span>
                <span>Republic of Kenya</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Regulatory Status:</span>
                <span>Registration pending</span>
              </div>
            </div>
          </Card>

          <Card className="p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <h2 className="text-3xl font-bold mb-6 text-center">Questions About Legal Matters?</h2>
            <p className="text-center text-muted-foreground mb-8">
              For legal inquiries, compliance questions, or to report issues
            </p>
            <div className="text-center space-y-2">
              <p className="text-lg">
                <strong>Legal Department:</strong> legal@bak55talent.co.ke
              </p>
              <p className="text-sm text-muted-foreground">
                We aim to respond to all legal inquiries within 48 hours
              </p>
            </div>
          </Card>

          <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-primary/10">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Disclaimer:</strong> The information provided on this page is for general informational purposes only and does not constitute legal advice. For specific legal concerns, please consult with a qualified attorney.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Legal;
