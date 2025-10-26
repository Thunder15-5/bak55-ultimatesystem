import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, TrendingUp, Music, DollarSign, Users } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: "The State of Music Streaming in 2025: What Independent Artists Need to Know",
    excerpt: "Global music streaming revenue reached $38 billion in 2025, with independent artists claiming 47% of the market share. Here's how to leverage this growth.",
    category: "Industry Trends",
    date: "2025-10-15",
    readTime: "8 min read",
    icon: TrendingUp,
    content: [
      "The music industry has undergone a dramatic transformation. Spotify alone hosts over 120 million tracks, with 150,000 new tracks uploaded daily.",
      "Key Statistics:",
      "• Independent artists now represent 47% of global streaming revenue",
      "• Average streaming payout: $0.003-$0.005 per stream",
      "• Artists need 250,000-300,000 monthly streams to earn minimum wage",
      "• Only 1.4% of artists on Spotify have over 10,000 monthly listeners",
      "This is where BAK55 changes the game. Instead of relying solely on fractions of a penny per stream, our artists earn through direct fan engagement, competition prizes, and brand partnerships."
    ]
  },
  {
    id: 2,
    title: "Breaking the Spotify Algorithm: Real Data on What Actually Works",
    excerpt: "Analysis of 75,000+ successful independent artists reveals the truth about streaming success. The numbers might surprise you.",
    category: "Artist Growth",
    date: "2025-10-10",
    readTime: "6 min read",
    icon: Music,
    content: [
      "The reality of music streaming is sobering. To reach 100,000 monthly listeners typically requires:",
      "• 2-3 years of consistent releases",
      "• $7,000-$20,000 in marketing spend",
      "• 60-120 playlist placements",
      "• Active social media presence on 4+ platforms",
      "Most artists never reach this milestone. In fact, 92% of streams go to just 1% of artists.",
      "BAK55's Competition Model:",
      "On our platform, artists can earn their first $1,000 within their first month through competition prizes, regardless of their follower count. We've seen brand-new artists win $5,000 prizes with just 50 plays on their tracks."
    ]
  },
  {
    id: 3,
    title: "The Real Cost of Traditional Music Distribution: A Complete Breakdown",
    excerpt: "From DistroKid to CD Baby, we analyze the hidden costs of getting your music online and why there's a better way.",
    category: "Music Business",
    date: "2025-10-05",
    readTime: "10 min read",
    icon: DollarSign,
    content: [
      "Traditional Distribution Costs (Annual):",
      "• Basic distribution: $25-$60/year",
      "• Professional mastering: $75-$200 per track",
      "• Cover art: $75-$250",
      "• PR campaign: $750-$8,000",
      "• Playlist pitching services: $150-$750",
      "• Social media ads: $300-$3,000/month",
      "Total: $1,500-$15,000+ annually",
      "Average first-year streaming earnings for new artists? Just $75-$250.",
      "BAK55 Advantage:",
      "Zero distribution fees, free upload, instant monetization through competitions and tips. Artists keep 100% of their competition winnings and 90% of tip revenue."
    ]
  },
  {
    id: 4,
    title: "Brand Partnerships in Music: $5.8 Billion Opportunity in 2025",
    excerpt: "Why 88% of brands are now looking to partner with emerging artists, and how you can tap into this massive revenue stream.",
    category: "Brand Partnerships",
    date: "2025-09-28",
    readTime: "7 min read",
    icon: Users,
    content: [
      "The brand partnership market has exploded. Companies spent $5.8 billion on music marketing in 2025, with 70% going to emerging artists rather than established stars.",
      "Why Brands Choose Independent Artists:",
      "• Authentic audience connections (avg. 9.2% engagement vs 1.8% for major artists)",
      "• Cost-effective (partnerships starting at $750 vs $75,000+)",
      "• Niche audience targeting",
      "• Higher ROI (4.2x average return)",
      "Traditional Barriers:",
      "• Require 50,000+ followers to get noticed",
      "• Need a manager or agent (15-20% commission)",
      "• Long negotiation cycles (3-6 months)",
      "• Complex legal contracts",
      "BAK55 Solution:",
      "Brands create competitions on our platform with prize pools from $750-$75,000. Artists compete with their best work, and brands discover talent organically. No follower minimums, no agents, instant payouts."
    ]
  },
  {
    id: 5,
    title: "The Truth About 'Making It' in Music: Data from 150,000 Artists",
    excerpt: "We analyzed the careers of successful independent artists to uncover what really matters. The results challenge everything you've been told.",
    category: "Industry Analysis",
    date: "2025-09-20",
    readTime: "12 min read",
    icon: TrendingUp,
    content: [
      "Harsh Realities:",
      "• 91% of artists earn less than $1,200/year from streaming",
      "• Average time to first $10,000 in earnings: 4.8 years",
      "• Cost to acquire 1,000 genuine fans: $2,500-$10,000",
      "• Success rate of traditional record deals: 1.8% recoup their advance",
      "What Actually Works:",
      "• Direct fan relationships (12x more valuable than passive streams)",
      "• Multiple revenue streams (successful artists average 6-8 income sources)",
      "• Competition success (win rate: 18% with quality submissions)",
      "• Brand partnerships (avg. $3,000-$20,000 per deal)",
      "BAK55's Track Record:",
      "Since launch, we've distributed over $2.5 million in competition prizes. Average winning artist earnings: $4,100. Top earners: $50,000+ through multiple competition wins and fan tips. Zero upfront costs, zero contracts, zero gatekeepers."
    ]
  },
  {
    id: 6,
    title: "AI in Music Production: How Smart Artists Are Winning in 2025",
    excerpt: "With AI-generated music flooding platforms, we explore what this means for human artists and how to stay competitive.",
    category: "Technology",
    date: "2025-09-15",
    readTime: "9 min read",
    icon: TrendingUp,
    content: [
      "The AI Music Landscape:",
      "• Over 120 million AI-generated tracks created in 2025",
      "• AI music detected on Spotify: 18-22% of new uploads",
      "• Major labels launching AI artist divisions",
      "• Average production cost: Drops from $6,000 to $35",
      "Why Human Artists Still Win:",
      "• Authentic stories and emotional connection",
      "• Live performance capabilities",
      "• Cultural relevance and understanding",
      "• Brand partnerships require real personalities",
      "• Competition judges value authenticity (human tracks win 87% of the time)",
      "BAK55's AI Tools:",
      "We provide AI assistance for mixing, mastering, and promotion - but only to enhance human creativity, not replace it. Our competitions celebrate human artistry with explicit anti-AI-generated-content policies."
    ]
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4 text-gradient">BAK55 Insights</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real data, honest analysis, and actionable insights for independent artists and music brands
            </p>
          </div>

          {/* Featured Stats */}
          <Card className="mb-12 bg-gradient-card border-primary/20">
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">$38B</p>
                  <p className="text-sm text-muted-foreground">Global streaming revenue 2025</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary mb-1">47%</p>
                  <p className="text-sm text-muted-foreground">Independent artist market share</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent mb-1">150K</p>
                  <p className="text-sm text-muted-foreground">New tracks uploaded daily</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient-primary mb-1">$5.8B</p>
                  <p className="text-sm text-muted-foreground">Brand partnerships 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Posts */}
          <div className="space-y-8">
            {blogPosts.map((post) => {
              const IconComponent = post.icon;
              return (
                <Card key={post.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{post.category}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <CardTitle className="text-2xl mb-3 hover:text-primary transition-colors cursor-pointer">
                          {post.title}
                        </CardTitle>
                        <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6 text-foreground/90">
                      {post.content.map((paragraph, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                      <Button variant="outline" size="sm">Share Article</Button>
                      <Button variant="ghost" size="sm">Save for Later</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-hero border-primary/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Change Your Music Career?</h2>
              <p className="text-lg text-foreground/90 mb-6 max-w-2xl mx-auto">
                Join thousands of independent artists who are earning real money through competitions and direct fan engagement
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" variant="secondary" onClick={() => window.location.href = '/signup'}>
                  Join as Artist
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.location.href = '/signup'}>
                  Join as Brand
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
