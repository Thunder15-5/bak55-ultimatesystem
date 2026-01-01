import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold">
              Cookie <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>

          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our platform, and enabling certain features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Types of Cookies We Use</h2>
                
                <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
                <p className="text-muted-foreground mb-4">
                  These cookies are necessary for the website to function properly. They enable core functionality such as:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>User authentication and session management</li>
                  <li>Security features and fraud prevention</li>
                  <li>Remembering your login status</li>
                  <li>Processing transactions securely</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">Analytics Cookies</h3>
                <p className="text-muted-foreground mb-4">
                  These cookies help us understand how visitors interact with our platform:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Pages visited and time spent</li>
                  <li>Features used most frequently</li>
                  <li>Error tracking and performance monitoring</li>
                  <li>General usage patterns and trends</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">Preference Cookies</h3>
                <p className="text-muted-foreground mb-4">
                  These cookies remember your settings and preferences:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Language and region preferences</li>
                  <li>Volume settings for music player</li>
                  <li>Dark/light theme preference</li>
                  <li>Recently played tracks and playlists</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may use third-party services that set their own cookies:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Supabase:</strong> For authentication and database services</li>
                  <li><strong>Payment Providers:</strong> For processing transactions securely</li>
                  <li><strong>Analytics Services:</strong> For understanding platform usage</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You can control and manage cookies in several ways:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies through their settings menu</li>
                  <li><strong>Private Browsing:</strong> Use incognito/private browsing mode to prevent cookies from being stored</li>
                  <li><strong>Cookie Management Tools:</strong> Various browser extensions can help manage cookies</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Please note that disabling essential cookies may affect the functionality of our platform, including your ability to log in and use core features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Cookie Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Different cookies have different retention periods:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Remain for a set period (typically 30 days to 1 year)</li>
                  <li><strong>Authentication Cookies:</strong> Expire after 7 days of inactivity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    If you have questions about our use of cookies:
                    <br /><br />
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

export default CookiePolicy;