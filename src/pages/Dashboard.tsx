import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Trophy, Users, Wallet } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const { data: tracks } = useQuery({
    queryKey: ["user-tracks", user?.id],
    queryFn: async () => {
      if (userRole?.role !== "artist") return [];
      const { data } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", user!.id);
      return data || [];
    },
    enabled: userRole?.role === "artist",
  });

  const { data: competitions } = useQuery({
    queryKey: ["active-competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("status", "active");
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {profile?.username}!
          </h1>
          <p className="text-muted-foreground">
            Role: <span className="text-primary font-semibold capitalize">{userRole?.role}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {wallet?.balance || 0} BAK
              </div>
              <p className="text-xs text-muted-foreground">BAKCoins available</p>
            </CardContent>
          </Card>

          {userRole?.role === "artist" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Tracks</CardTitle>
                <Music className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tracks?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Tracks uploaded</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
              <Trophy className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{competitions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Open for entry</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-semibold capitalize">{userRole?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold">{profile?.email}</span>
              </div>
              {profile?.location && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold">{profile.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Your recent activity will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
