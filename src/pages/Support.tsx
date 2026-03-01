import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Mail, MessageSquare, Book, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I earn BAKCoins?",
    answer: "You can earn BAKCoins through competition prizes, fan tips, platform contributions (creating playlists, referring users), and engagement rewards. Artists earn the most through competitions and direct fan support."
  },
  {
    question: "How do I withdraw my earnings?",
    answer: "Go to your Wallet, click 'Withdraw', and enter the amount you want to convert to cash. We process withdrawals to M-Pesa within 24 hours. A 15% fee applies (10% for high-volume earners)."
  },
  {
    question: "What is the exchange rate for BAKCoins?",
    answer: "1 BAKCoin = $0.16 USD. This rate is fixed and transparent across the platform."
  },
  {
    question: "How do competitions work?",
    answer: "Artists submit tracks to active competitions. During the voting phase, fans vote for their favorites. Winners are determined by 70% fan votes + 30% AI scoring. Prizes are awarded in BAKCoins or cash."
  },
  {
    question: "How do I become an artist on BAK55?",
    answer: "Click 'Join as Artist' and complete your profile with stage name, genres, and bio. You can then upload tracks (1 free, unlimited with subscription) and enter competitions."
  },
  {
    question: "Is my music safe on BAK55?",
    answer: "Yes! You retain full ownership of all content you upload. We only obtain a license to host, stream, and promote your music on our platform. You can remove your content at any time."
  },
  {
    question: "What are the subscription benefits?",
    answer: "Subscribed artists get unlimited track uploads, priority support, advanced analytics, and can enter unlimited competitions simultaneously. Free users are limited to 1 track and 1 active competition."
  },
  {
    question: "How do fan tips work?",
    answer: "Fans can send tips directly to artists they love. 90% goes to the artist, 10% platform fee. Tips are added to your BAKCoin balance and can be withdrawn anytime."
  }
];

const Support = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('support_tickets')
        .insert({ name, email, message });

      if (dbError) throw dbError;

      // Send notification email to admin
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'support@bak55talent.co.ke',
          subject: '🎫 New Support Ticket',
          template: 'contact',
          data: { name, email, message, type: 'Support Form' }
        }
      });

      toast.success("Message sent! We'll get back to you within 24 hours.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold">
              How Can We <span className="text-gradient">Help?</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Get in touch with our support team—we're here to help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">FAQ</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Quick answers to common questions
              </p>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}>
                View FAQ
              </Button>
            </Card>

            <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-secondary/10 hover:border-secondary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mx-auto mb-4">
                <Book className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentation</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Detailed guides and tutorials
              </p>
              <Button variant="outline" size="sm" disabled>Coming Soon</Button>
            </Card>

            <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-accent/10 hover:border-accent/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Live Chat</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Real-time support during business hours
              </p>
              <Button variant="outline" size="sm" disabled>Coming Soon</Button>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card id="faq-section" className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-primary/10 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Card className="p-12 bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Send Us a Message</h2>
                <p className="text-muted-foreground">
                  We typically respond within 24 hours
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background/50 border-primary/20 focus:border-primary min-h-[150px]"
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </Card>

          <Card className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Need Immediate Assistance?</h3>
              <p className="text-muted-foreground">
                For urgent matters regarding your account or payments:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="text-sm">
                  <span className="font-semibold">Email:</span> support@bak55talent.co.ke
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Hours:</span> Mon-Fri 9AM-6PM EAT
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Support;