import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-muted-foreground">Last updated: 08 October 2025</p>
          </div>

          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  BAK55 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website and mobile applications.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
                <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Name, email address, and contact information</li>
                  <li>Profile information including artist name, bio, and profile picture</li>
                  <li>Payment information and BAKCoins wallet data</li>
                  <li>Content you upload (music, videos, images)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">Usage Information</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Platform usage data and interaction patterns</li>
                  <li>Device information, IP address, and browser type</li>
                  <li>Listening history and preferences</li>
                  <li>Competition participation and voting activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Process payments and BAKCoins transactions</li>
                  <li>Personalize your experience with AI-powered recommendations</li>
                  <li>Communicate with you about updates, promotions, and competitions</li>
                  <li>Analyze platform usage to improve features</li>
                  <li>Prevent fraud and ensure platform security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground mb-4">We may share your information with:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Service Providers:</strong> Payment processors, cloud hosting, analytics services</li>
                  <li><strong>Other Users:</strong> Your public profile information is visible to other platform users</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your information. However, no electronic transmission or storage system is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Object to certain data processing activities</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not directed to individuals under 16 years of age. We do not knowingly collect personal information from children without parental consent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on our platform and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> privacy@bak55talent.co.ke<br />
                    <strong>Address:</strong> BAK55 Talent, Nairobi, Kenya
                  </p>
                </div>
              </section>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
