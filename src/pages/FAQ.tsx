import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Music2, Coins, Trophy, Shield, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FAQ = () => {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: Music2,
      items: [
        {
          question: "What is BAK55 Talent?",
          answer: "BAK55 Talent is Africa's first hybrid music discovery platform that combines AI technology with fan voting to discover and promote emerging musical talent. We connect artists with fans, brands, and opportunities through competitions, streaming, and our unique BAKCoin economy."
        },
        {
          question: "How do I create an account?",
          answer: "Click 'Get Started' on the homepage, choose your role (Fan, Artist, or Brand), and fill out the registration form. Currently, BAK55 is available only in Kenya, so you'll need to confirm you're based there. After registration, you'll receive a verification email."
        },
        {
          question: "What's the difference between Fan, Artist, and Brand accounts?",
          answer: "Fans can stream music, vote in competitions, and earn rewards. Artists can upload music, enter competitions, and earn from streams and tips. Brands can sponsor competitions, discover talent, and partner with artists for marketing campaigns."
        },
        {
          question: "Is BAK55 available outside Kenya?",
          answer: "Currently, BAK55 is exclusively available in Kenya. We're working on expanding to more African countries soon! Sign up for our newsletter to be notified when we launch in your region."
        }
      ]
    },
    {
      title: "BAKCoins & Wallet",
      icon: Coins,
      items: [
        {
          question: "What are BAKCoins?",
          answer: "BAKCoins are our platform's utility tokens used for voting, tipping artists, entering competitions, and purchasing subscriptions. 1 BAKCoin = $0.20 USD (approximately 26 KES at current exchange rates)."
        },
        {
          question: "How do I buy BAKCoins?",
          answer: "Go to your Wallet, click 'Buy Coins', and follow the M-Pesa payment instructions. Use PayBill 247247 with account number 1650184905841. After payment, submit your receipt code and the coins will be credited once verified by admin."
        },
        {
          question: "How do I withdraw my earnings?",
          answer: "Navigate to your Wallet, enter the amount you want to withdraw, and provide your M-Pesa phone number. There's a 15% withdrawal fee. Withdrawals are processed within 24 hours after admin approval."
        },
        {
          question: "Why is there a withdrawal fee?",
          answer: "The 15% fee covers M-Pesa transaction costs, platform maintenance, and ensures the sustainability of our artist payment system. This helps us continue supporting emerging African artists."
        }
      ]
    },
    {
      title: "Competitions",
      icon: Trophy,
      items: [
        {
          question: "How do competitions work?",
          answer: "Our flagship 'Founders Season' starts with 55 artists and narrows down to 1 winner over 7 elimination stages. Scoring combines 70% fan votes with 30% expert/AI judging. Entry fees and voting payments contribute to the prize pool."
        },
        {
          question: "How do I enter a competition?",
          answer: "Artists can view active competitions from their dashboard. Click 'Enter Competition', pay the entry fee (if any), and submit your track. Your submission will be reviewed before going live for voting."
        },
        {
          question: "How does voting work?",
          answer: "Fans can vote for their favorite artists using BAKCoins. Each vote costs 1 BAKCoin. You can vote multiple times for the same artist. Voting periods are clearly displayed on each competition."
        },
        {
          question: "What do winners receive?",
          answer: "Winners receive the accumulated prize pool in BAKCoins, plus badges, profile verification, featured placement, and potential brand partnership opportunities. Specific prizes vary by competition."
        }
      ]
    },
    {
      title: "For Artists",
      icon: Music2,
      items: [
        {
          question: "How do I upload music?",
          answer: "Go to your Artist Dashboard and click 'Upload Track'. Upload your MP3 file (max 50MB), add cover art, fill in details like title and genre, and submit. Free accounts get 1 upload; subscribed artists get unlimited uploads."
        },
        {
          question: "How do I earn money?",
          answer: "Artists earn through: fan tips, competition prizes, streaming royalties (coming soon), brand partnerships, and merchandise sales (coming soon). All earnings accumulate in your BAKCoin wallet."
        },
        {
          question: "What music formats are supported?",
          answer: "We currently support MP3 files up to 50MB. Cover art should be JPG or PNG format. High-quality files (320kbps) are recommended for the best listening experience."
        },
        {
          question: "How do subscriptions benefit artists?",
          answer: "Subscribed artists get unlimited track uploads, priority support, advanced analytics, verified badge, and reduced withdrawal fees. Monthly plans start at 200 KES."
        }
      ]
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      items: [
        {
          question: "How is my data protected?",
          answer: "We use industry-standard encryption for all data transmission and storage. Your payment information is never stored on our servers. See our Privacy Policy for complete details."
        },
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page, enter your email, and we'll send you a reset link. Check your spam folder if you don't see the email within a few minutes."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can request account deletion from your Profile settings. This will remove all your personal data. Note that any BAKCoins in your wallet should be withdrawn before deletion."
        },
        {
          question: "How do I report suspicious activity?",
          answer: "Contact our support team immediately at support@bak55talent.co.ke or use the in-app support chat. We take fraud and security concerns very seriously."
        }
      ]
    },
    {
      title: "Payments & Billing",
      icon: CreditCard,
      items: [
        {
          question: "What payment methods are accepted?",
          answer: "We currently accept M-Pesa payments for Kenyan users. PayBill: 247247, Account: 1650184905841. More payment methods will be added as we expand."
        },
        {
          question: "Are subscriptions auto-renewed?",
          answer: "Currently, subscriptions do not auto-renew. You'll receive a notification before your subscription expires so you can manually renew if desired."
        },
        {
          question: "What is your refund policy?",
          answer: "BAKCoin purchases are generally non-refundable once credited to your account. Competition entry fees are non-refundable after submission. For billing errors or technical issues, contact support within 48 hours."
        },
        {
          question: "How do I get a payment receipt?",
          answer: "All transactions are logged in your Wallet history. You'll also receive confirmation via email for major purchases. For official receipts, contact support with your transaction ID."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find answers to common questions about BAK55 Talent
            </p>
          </div>

          <div className="space-y-8">
            {faqCategories.map((category, index) => (
              <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{category.title}</h2>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem 
                      key={itemIndex} 
                      value={`item-${index}-${itemIndex}`}
                      className="border border-primary/10 rounded-lg px-4 data-[state=open]:bg-primary/5 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-medium text-left">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>

          {/* Still have questions CTA */}
          <Card className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 text-center">
            <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/support">
                <Button variant="hero">Contact Support</Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline">Send Message</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
