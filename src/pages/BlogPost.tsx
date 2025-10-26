import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Share2, Bookmark, ArrowLeft, TrendingUp, Music, DollarSign, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Import the same blog posts data
import { blogPosts } from './blogData';

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  
  const post = blogPosts.find(p => p.id === Number(id));

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`saved_posts_${user.id}`);
      if (saved) {
        setSavedPosts(JSON.parse(saved));
      }
    }
  }, [user]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
        </main>
      </div>
    );
  }

  const IconComponent = post.icon;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = () => {
    if (!user) {
      toast.error('Please log in to save articles');
      return;
    }

    const newSaved = savedPosts.includes(id!)
      ? savedPosts.filter(postId => postId !== id)
      : [...savedPosts, id!];
    
    setSavedPosts(newSaved);
    localStorage.setItem(`saved_posts_${user.id}`, JSON.stringify(newSaved));
    toast.success(newSaved.includes(id!) ? 'Article saved!' : 'Article removed from saved');
  };

  const isSaved = savedPosts.includes(id!);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Articles
          </Button>

          {/* Article Header */}
          <Card className="bg-gradient-card border-border/50 mb-6">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
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
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
                  <p className="text-lg text-muted-foreground">{post.excerpt}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t border-border/50">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Article
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSave}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save for Later'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Article Content */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-8">
              <div className="prose prose-invert max-w-none">
                {post.content.map((paragraph, idx) => (
                  <p key={idx} className="text-foreground/90 text-lg leading-relaxed mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="mt-8 bg-gradient-hero border-primary/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Music Career?</h2>
              <p className="text-lg text-foreground/90 mb-6 max-w-2xl mx-auto">
                Join thousands of independent artists earning real money through competitions
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
                  Join as Artist
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/signup')}>
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
