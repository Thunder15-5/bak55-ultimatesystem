import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Home, Music, Trophy, Wallet, User, LogOut, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      return data?.role;
    },
    enabled: !!user,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary" />
            <span className="font-bold text-xl text-primary">BAK55</span>
          </Link>

          <div className="flex items-center space-x-1">
            <Link to="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Home</span>
              </Button>
            </Link>

            {userRole === "artist" && (
              <Link to="/tracks">
                <Button
                  variant={isActive("/tracks") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Music className="w-4 h-4" />
                  <span className="hidden md:inline">My Tracks</span>
                </Button>
              </Link>
            )}

            <Link to="/competitions">
              <Button
                variant={isActive("/competitions") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden md:inline">Competitions</span>
              </Button>
            </Link>

            <Link to="/wallet">
              <Button
                variant={isActive("/wallet") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden md:inline">
                  {wallet?.balance || 0} BAK
                </span>
              </Button>
            </Link>

            {userRole === "admin" && (
              <Link to="/admin">
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden md:inline">Admin</span>
                </Button>
              </Link>
            )}

            <Link to="/profile">
              <Button
                variant={isActive("/profile") ? "default" : "ghost"}
                size="sm"
              >
                <User className="w-4 h-4" />
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
