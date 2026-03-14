import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard, DashboardHeader, QuickActions, DashboardSkeleton } from "@/components/dashboard";
import {
  Music2, DollarSign, Users, TrendingUp, Star, Upload,
  ShoppingCart, MessageSquare, Award, BarChart3, Headphones, Zap
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

export default function ProducerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();

      const channel = supabase
        .channel('producer_wallet_rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Parallel fetch all data
      const [profileRes, beatsRes, walletRes] = await Promise.all([
        supabase.from('producer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('beats').select('*').eq('producer_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (beatsRes.data) setBeats(beatsRes.data);
      if (walletRes.data) setWalletBalance(walletRes.data.balance);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const tiers: Record<string, { bg: string; icon: string }> = {
      platinum: { bg: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", icon: "💎" },
      elite: { bg: "bg-gradient-to-r from-warning to-secondary text-white", icon: "🏆" },
      pro: { bg: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white", icon: "⭐" },
    };
    return tiers[tier] || { bg: "bg-secondary text-secondary-foreground", icon: "🎵" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16 pb-24">
        {loading ? (
          <DashboardSkeleton statsCount={4} />
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <DashboardHeader
              greeting="Producer Studio"
              username={profile?.producer_name || 'Producer'}
              subtitle="Manage your beats, track sales, and connect with artists"
              actions={[
                { label: "Upload Beat", icon: Upload, variant: "hero" as any, onClick: () => navigate("/producer/upload") },
              ]}
            />

            {profile && (
              <div className="flex items-center gap-2 -mt-4">
                {profile.verified && (
                  <Badge variant="outline" className="border-primary text-primary text-xs">
                    <Award className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
                <Badge className={getTierBadge(profile.producer_tier).bg}>
                  {getTierBadge(profile.producer_tier).icon} {profile.producer_tier?.toUpperCase() || 'STARTER'}
                </Badge>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard icon={DollarSign} label="BAK Balance" value={walletBalance.toLocaleString()} variant="primary" link="/producer/wallet" />
              <StatsCard icon={TrendingUp} label="Total Earnings" value={profile?.total_earnings?.toLocaleString() || "0"} variant="success" />
              <StatsCard icon={ShoppingCart} label="Licenses Sold" value={profile?.total_licenses_issued || 0} variant="accent" />
              <StatsCard icon={Star} label="Rating" value={`${profile?.average_rating || 0}/5`} subtitle={`${profile?.total_reviews || 0} reviews`} variant="warning" />
            </div>

            {/* Quick Actions */}
            <QuickActions
              columns={4}
              actions={[
                { icon: Upload, label: "Upload Beat", link: "/producer/upload", variant: "hero" },
                { icon: BarChart3, label: "Analytics", link: "/producer/analytics" },
                { icon: DollarSign, label: "Wallet", link: "/producer/wallet" },
                { icon: Users, label: "Profile", link: "/producer/profile" },
              ]}
            />

            {/* Beats & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-primary" />
                    Your Beats
                  </CardTitle>
                  <CardDescription className="text-xs">Recent uploads and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {beats.length > 0 ? (
                    <div className="space-y-2">
                      {beats.map((beat) => (
                        <div key={beat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                              <Headphones className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{beat.title}</p>
                              <p className="text-xs text-muted-foreground">{beat.genre}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {beat.plays}</span>
                            <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {beat.total_leases_sold}</span>
                            <Badge variant={beat.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{beat.status}</Badge>
                          </div>
                        </div>
                      ))}
                      <Link to="/producer/catalog"><Button variant="outline" className="w-full mt-2" size="sm">View All Beats</Button></Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Music2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm mb-3">No beats uploaded yet</p>
                      <Link to="/producer/upload"><Button variant="hero" size="sm"><Upload className="w-4 h-4 mr-2" /> Upload First Beat</Button></Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upgrade card for starter tier */}
              <div className="space-y-6">
                {profile?.producer_tier === 'starter' && (
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="p-5 text-center space-y-3">
                      <Zap className="w-8 h-8 text-primary mx-auto" />
                      <div>
                        <h3 className="font-bold">Upgrade to Pro</h3>
                        <p className="text-xs text-muted-foreground mt-1">More visibility, lower fees, premium features</p>
                      </div>
                      <Link to="/producer/subscribe"><Button variant="hero" size="sm" className="w-full">Upgrade Now</Button></Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
