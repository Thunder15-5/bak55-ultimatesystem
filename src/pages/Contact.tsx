import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { contactSchema, mapDatabaseError } from "@/lib/validation";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validated = contactSchema.parse({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      // Store in database
      const { error } = await supabase
        .from('contacts')
        .insert([
          {
            name: validated.name,
            email: validated.email,
            subject: validated.subject,
            message: validated.message,
          }
        ]);

      // Send email notification to admin
      await supabase.functions.invoke('send-notification-email', {
        body: {
          to: 'info@bak55talent.co.ke',
          subject: `📧 Contact Form: ${validated.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${validated.name}</p>
            <p><strong>Email:</strong> ${validated.email}</p>
            <p><strong>Subject:</strong> ${validated.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${validated.message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted at ${new Date().toLocaleString()}</small></p>
          `
        }
      });

      if (error) {
        toast.error(mapDatabaseError(error));
        return;
      }

      toast.success("Message sent successfully!", {
        description: "We'll get back to you within 24-48 hours"
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      if (error.errors) {
        // Zod validation error
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 md:space-y-6 mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We'd love to hear from you—artists, fans, partners, or investors
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">Email</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>General: info@bak55talent.co.ke</p>
                  <p>Support: support@bak55talent.co.ke</p>
                  <p>Press: press@bak55talent.co.ke</p>
                  <p>Investors: investor@bak55talent.co.ke</p>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">Location</h3>
                <p className="text-sm text-muted-foreground">
                  Nairobi, Kenya
                  <br />
                  East Africa Hub
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-accent/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">Business Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday
                  <br />
                  9:00 AM - 6:00 PM EAT
                </p>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/10">
                <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name *</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary h-11"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary h-11"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <Input
                      type="text"
                      placeholder="What is this about?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-background/50 border-primary/20 focus:border-primary h-11"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message *</label>
                    <Textarea
                      placeholder="Tell us more..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-background/50 border-primary/20 focus:border-primary min-h-[150px] md:min-h-[200px]"
                      required
                    />
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full h-12 md:h-14 text-base" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    We typically respond within 24-48 hours
                  </p>
                </form>
              </Card>
            </div>
          </div>

          {/* Social Links */}
          <Card className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Connect With Us</h3>
              <p className="text-muted-foreground">
                Follow our journey and stay updated on the latest news
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button variant="outline" asChild>
                  <a href="https://twitter.com/bak55talent" target="_blank" rel="noopener noreferrer">Twitter</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://instagram.com/bak55talent" target="_blank" rel="noopener noreferrer">Instagram</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://linkedin.com/company/bak55talent" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://facebook.com/bak55talent" target="_blank" rel="noopener noreferrer">Facebook</a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
