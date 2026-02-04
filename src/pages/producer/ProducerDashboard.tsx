import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Music2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Star, 
  Upload, 
  ShoppingCart, 
  MessageSquare,
  Award,
  BarChart3,
  Headphones,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface ProducerProfile {
  producer_name: string;
  producer_tier: string;
  verified: boolean;
  total_earnings: number;
  total_beats_sold: number;
  total_licenses_issued: number;
  average_rating: number;
  total_reviews: number;
  available_for_hire: boolean;
}

interface Beat {
  id: string;
  title: string;
  genre: string;
  plays: number;
  likes: number;
  total_leases_sold: number;
  status: string;
  created_at: string;
}

interface CollabRequest {
  id: string;
  project_type: string;
  status: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
  profiles: { username: string; avatar_url: string };
}

export default function ProducerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch producer profile
      const { data: profileData } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch beats
      const { data: beatsData } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (beatsData) {
        setBeats(beatsData);
      }

      // Fetch collaboration requests
      const { data: collabData } = await supabase
        .from('producer_collaboration_requests')
        .select('*, profiles!producer_collaboration_requests_from_artist_id_fkey(username, avatar_url)')
        .eq('to_producer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (collabData) {
        setCollabRequests(collabData as any);
      }

      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWalletBalance(walletData.balance);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'elite': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'elite': return '🏆';
      case 'pro': return '⭐';
      default: return '🎵';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold">
                Welcome, <span className="text-gradient">{profile?.producer_name || 'Producer'}</span>
              </h1>
              {profile?.verified && (
                <Badge variant="outline" className="border-primary text-primary">
                  <Award className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              <Badge className={getTierColor(profile?.producer_tier || 'starter')}>
                {getTierIcon(profile?.producer_tier || 'starter')} {profile?.producer_tier?.toUpperCase() || 'STARTER'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage your beats, track sales, and connect with artists
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/producer/upload">
              <Button variant="hero" className="gap-2">
                <Upload className="w-4 h-4" /> Upload Beat
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{walletBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">BAK Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.total_earnings?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ShoppingCart className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.total_licenses_issued || 0}</p>
                  <p className="text-xs text-muted-foreground">Licenses Sold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.average_rating || 0}/5</p>
                  <p className="text-xs text-muted-foreground">{profile?.total_reviews || 0} Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Beats */}
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary" />
                Your Beats
              </CardTitle>
              <CardDescription>Recent uploads and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {beats.length > 0 ? (
                <div className="space-y-3">
                  {beats.map((beat) => (
                    <div 
                      key={beat.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Headphones className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{beat.title}</p>
                          <p className="text-xs text-muted-foreground">{beat.genre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> {beat.plays}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" /> {beat.total_leases_sold}
                        </span>
                        <Badge variant={beat.status === 'active' ? 'default' : 'secondary'}>
                          {beat.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No beats uploaded yet</p>
                  <Link to="/producer/upload">
                    <Button variant="hero">
                      <Upload className="w-4 h-4 mr-2" /> Upload Your First Beat
                    </Button>
                  </Link>
                </div>
              )}
              {beats.length > 0 && (
                <Link to="/producer/catalog" className="block mt-4">
                  <Button variant="outline" className="w-full">View All Beats</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Collaboration Requests */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Collab Requests
              </CardTitle>
              <CardDescription>Pending collaboration requests</CardDescription>
            </CardHeader>
            <CardContent>
              {collabRequests.length > 0 ? (
                <div className="space-y-3">
                  {collabRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">@{request.profiles?.username}</p>
                        <Badge variant="outline">{request.project_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Budget: {request.budget_min} - {request.budget_max} BAK
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No pending requests</p>
                </div>
              )}
              {collabRequests.length > 0 && (
                <Link to="/producer/collaborations" className="block mt-4">
                  <Button variant="outline" className="w-full">View All</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link to="/producer/upload">
            <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="p-4 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="font-medium">Upload Beat</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/producer/analytics">
            <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Analytics</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/producer/wallet">
            <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Wallet</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/producer/profile">
            <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                <p className="font-medium">Profile</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upgrade Prompt for Starter Tier */}
        {profile?.producer_tier === 'starter' && (
          <Card className="mt-8 border-primary/40 bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Upgrade to Pro</h3>
                  <p className="text-muted-foreground text-sm">
                    Get more visibility, lower platform fees, and premium features
                  </p>
                </div>
              </div>
              <Link to="/producer/subscribe">
                <Button variant="hero">Upgrade Now</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
