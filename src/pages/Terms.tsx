import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold">
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="text-muted-foreground">Last updated: 08 October 2025</p>
          </div>

          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using BAK55's platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you do not have permission to access the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Eligibility</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You must be at least 16 years old to use our services</li>
                  <li>You must provide accurate and complete registration information</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You must comply with all applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
                <h3 className="text-xl font-semibold mb-3">Artist Accounts</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You retain ownership of content you upload</li>
                  <li>You grant BAK55 a license to host, stream, and promote your content</li>
                  <li>You represent that you have all necessary rights to the content you upload</li>
                  <li>You are responsible for the accuracy of metadata and information</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">Fan Accounts</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You may stream, vote, and interact with content</li>
                  <li>You must respect artists' intellectual property rights</li>
                  <li>You may not engage in vote manipulation or fraudulent activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">BAKCoins Economy</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>BAKCoins are utility tokens for platform services (1 BAKCoin = $0.16 USD)</li>
                  <li>They are not investments and have no promise of appreciation</li>
                  <li>Withdrawal fees (15% standard) apply when converting to cash</li>
                  <li>BAK55 reserves the right to adjust coin value with notice</li>
                  <li>Lost or stolen coins cannot be recovered</li>
                  <li>You may not sell or transfer coins outside the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Competitions</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Competition rules and judging criteria are published for each event</li>
                  <li>Hybrid judging combines 70% fan votes with 30% expert + AI scoring</li>
                  <li>Prizes are awarded in BAKCoins or cash as specified</li>
                  <li>BAK55 reserves the right to disqualify fraudulent entries</li>
                  <li>Decisions are final and binding</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Content Guidelines</h2>
                <p className="text-muted-foreground mb-4">You may not upload content that:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains illegal, harmful, or offensive material</li>
                  <li>Promotes violence, hate speech, or discrimination</li>
                  <li>Violates any applicable laws or regulations</li>
                  <li>Contains malware or malicious code</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Payment and Withdrawals</h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>All transactions are in BAKCoins unless otherwise specified</li>
                  <li>Withdrawals to M-Pesa are processed within 24 hours</li>
                  <li>You are responsible for taxes on your earnings</li>
                  <li>BAK55 may suspend withdrawals if fraud is suspected</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The BAK55 platform, including its design, features, and technology, is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or create derivative works without permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Termination</h2>
                <p className="text-muted-foreground mb-4">
                  BAK55 may terminate or suspend your account at any time for violations of these terms, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Fraudulent activity or vote manipulation</li>
                  <li>Copyright infringement</li>
                  <li>Abusive behavior toward other users</li>
                  <li>Violation of payment or withdrawal policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED, SECURE, OR ERROR-FREE OPERATION. USE AT YOUR OWN RISK.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, BAK55 SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Refund Policy</h2>
                <p className="text-muted-foreground mb-4">
                  Our refund policy ensures fair treatment for all platform users:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>BAKCoin Purchases:</strong> Generally non-refundable once credited to your account. For billing errors or technical issues, contact support within 48 hours.</li>
                  <li><strong>Competition Entry Fees:</strong> Non-refundable after submission is made. If a competition is cancelled by BAK55, entry fees will be refunded in full.</li>
                  <li><strong>Subscription Fees:</strong> Prorated refunds may be available within 7 days of purchase if no premium features have been used.</li>
                  <li><strong>Processing Time:</strong> Approved refunds are processed within 5-7 business days via M-Pesa.</li>
                  <li><strong>Disputes:</strong> For payment disputes, email billing@bak55talent.co.ke with your transaction details.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Community Guidelines</h2>
                <p className="text-muted-foreground mb-4">
                  All users must adhere to the following community standards:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Respect Others:</strong> Treat all users with respect. Harassment, bullying, or discrimination of any kind is prohibited.</li>
                  <li><strong>Original Content:</strong> Only upload content you own or have rights to. Do not plagiarize or steal others' work.</li>
                  <li><strong>No Spam:</strong> Do not spam comments, messages, or votes. Automated activity is prohibited.</li>
                  <li><strong>Fair Competition:</strong> Vote manipulation, fake accounts, or any form of fraud will result in permanent ban.</li>
                  <li><strong>Appropriate Content:</strong> No explicit, violent, or illegal content. Keep interactions family-friendly.</li>
                  <li><strong>Constructive Feedback:</strong> When providing feedback, be constructive and helpful, not destructive.</li>
                  <li><strong>Report Violations:</strong> Help us maintain a safe community by reporting violations to support@bak55talent.co.ke.</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Violations may result in content removal, account suspension, or permanent ban depending on severity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    For questions about these Terms of Service:
                    <br /><br />
                    <strong>Email:</strong> legal@bak55talent.co.ke<br />
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

export default Terms;