import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do artists earn money on BAK55?",
    answer:
      "Artists earn BAKCoins through competition prizes, fan votes, tips, and track sales. BAKCoins can be cashed out anytime via M-Pesa. Artists keep up to 85% of their earnings — one of the highest rates in the industry.",
  },
  {
    question: "Is voting fair and transparent?",
    answer:
      "Yes. Competitions use a hybrid judging system: 70% fan votes + 30% AI analysis. Our fraud detection system prevents vote manipulation, and all results are publicly verifiable on the platform.",
  },
  {
    question: "How do BAKCoins work?",
    answer:
      "BAKCoins are the platform's currency. Fans buy BAKCoins to vote for artists and unlock exclusive content. Artists earn BAKCoins from votes, tips, and prizes — then cash out to real money via M-Pesa.",
  },
  {
    question: "Is BAK55 free to join?",
    answer:
      "Yes, creating an account is completely free for both artists and fans. Artists can upload tracks and enter competitions at no cost. Fans get starter BAKCoins on signup to begin voting immediately.",
  },
  {
    question: "How do payouts work?",
    answer:
      "Once you reach the minimum withdrawal threshold, you can cash out your BAKCoins directly to M-Pesa. Payouts are processed within 24-48 hours. Every payout is tracked and transparent.",
  },
  {
    question: "What genres are supported?",
    answer:
      "BAK55 supports all genres — Afrobeat, Bongo Flava, Gengetone, Amapiano, Hip Hop, R&B, Gospel, and more. Our competitions often feature genre-specific categories to ensure fair judging.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10 md:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Common Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm px-5 data-[state=open]:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
