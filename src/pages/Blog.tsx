import { PageSEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Share2, Bookmark } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { LiveStatsRow } from '@/components/LiveStatsRow';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { blogPosts } from './blogData';


export default function Blog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`saved_posts_${user.id}`);
      if (saved) {
        setSavedPosts(JSON.parse(saved));
      }
    }
  }, [user]);

  const handleShare = async (post: any) => {
    const { getBlogShareUrl } = await import('@/lib/shareUrl');
    const shareUrl = getBlogShareUrl(post.id, post.title, post.excerpt, post.image);
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = (postId: number) => {
    if (!user) {
      toast.error('Please log in to save articles');
      return;
    }

    const newSaved = savedPosts.includes(postId.toString())
      ? savedPosts.filter(id => id !== postId.toString())
      : [...savedPosts, postId.toString()];
    
    setSavedPosts(newSaved);
    localStorage.setItem(`saved_posts_${user.id}`, JSON.stringify(newSaved));
    toast.success(newSaved.includes(postId.toString()) ? 'Article saved!' : 'Article removed from saved');
  };

  const isSaved = (postId: number) => savedPosts.includes(postId.toString());

  return (
    <>
      <PageSEO page="blog" />
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Building BAK55 in Public</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Updates written by the team about what we shipped, what broke, and what we are still
              working on. No filler, no invented stories.
            </p>
          </div>

          {/* Live platform stats */}
          <Card className="mb-8 bg-gradient-card border-primary/20">
            <CardContent className="p-6 md:p-8">
              <LiveStatsRow />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Read live from our database. Whatever the numbers are, that is what we show.
              </p>
            </CardContent>
          </Card>

          {/* Editorial policy */}
          <Card className="mb-12 border-border/60">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Editorial policy:</span> we publish
              only real BAK55 updates. No AI-generated filler, no invented artist stories, no
              fabricated quotes or statistics. Every figure comes from our own data and is stated as
              of a date. Looking for the release history?{' '}
              <Link to="/changelog" className="text-primary underline underline-offset-2">
                See the changelog
              </Link>
              .
            </CardContent>
          </Card>


          {/* Blog Posts */}
          <div className="space-y-8">
            {blogPosts.map((post) => {
              const IconComponent = post.icon;
              return (
                <Card key={post.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                  {post.image && (
                    <div className="relative h-64 w-full overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                    </div>
                  )}
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
                        <CardTitle 
                          className="text-2xl mb-3 hover:text-primary transition-colors cursor-pointer"
                          onClick={() => navigate(`/blog/${post.id}`)}
                        >
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
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate(`/blog/${post.id}`)}
                      >
                        Read Full Article
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShare(post)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSave(post.id)}
                      >
                        <Bookmark className={`h-4 w-4 mr-2 ${isSaved(post.id) ? 'fill-current' : ''}`} />
                        {isSaved(post.id) ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-hero border-primary/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Join us early</h2>
              <p className="text-lg text-foreground/90 mb-6 max-w-2xl mx-auto">
                BAK55 is in open beta. Upload your music, enter competitions and get paid directly by
                fans — while the platform is still small enough for your feedback to shape it.
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
    </>
  );
}
