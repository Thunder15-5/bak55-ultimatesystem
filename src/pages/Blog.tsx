import { PageSEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Share2, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: `${window.location.origin}/blog/${post.id}`
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.id}`);
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
    </>
  );
}
