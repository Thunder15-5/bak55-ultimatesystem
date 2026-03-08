import { Link, useLocation } from "react-router-dom";
import { Home, Search, Upload, Wallet, User, Trophy, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

export function BottomNavigation() {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const unreadCount = useUnreadMessages(user?.id);

  if (!user) return null;

  const getNavItems = (): NavItem[] => {
    switch (userRole) {
      case "fan":
        return [
          { icon: Home, label: "Home", href: "/fan/dashboard" },
          { icon: Search, label: "Discover", href: "/fan/discover" },
          { icon: Trophy, label: "Vote", href: "/rising-stars/voting" },
          { icon: Wallet, label: "Wallet", href: "/fan/wallet" },
          { icon: User, label: "Profile", href: "/fan/profile" },
        ];
      case "artist":
        return [
          { icon: Home, label: "Home", href: "/artist/dashboard" },
          { icon: Upload, label: "Upload", href: "/artist/upload" },
          { icon: Search, label: "Discover", href: "/artist/discover" },
          { icon: Wallet, label: "Wallet", href: "/artist/wallet" },
          { icon: User, label: "Profile", href: "/artist/profile" },
        ];
      case "producer":
        return [
          { icon: Home, label: "Home", href: "/producer/dashboard" },
          { icon: Upload, label: "Upload", href: "/producer/upload" },
          { icon: Search, label: "Discover", href: "/producer/discover" },
          { icon: Wallet, label: "Wallet", href: "/producer/wallet" },
          { icon: User, label: "Profile", href: "/producer/profile" },
        ];
      case "brand":
        return [
          { icon: Home, label: "Home", href: "/brand/dashboard" },
          { icon: Search, label: "Discover", href: "/brand/discover" },
          { icon: Trophy, label: "Comps", href: "/brand/competitions" },
          { icon: Wallet, label: "Wallet", href: "/brand/wallet" },
          { icon: User, label: "Profile", href: "/brand/profile" },
        ];
      case "admin":
        return [
          { icon: Home, label: "Home", href: "/admin" },
          { icon: Search, label: "Catalog", href: "/catalog" },
          { icon: Trophy, label: "Comps", href: "/competitions" },
          { icon: User, label: "Profile", href: "/admin" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (navItems.length === 0) return null;

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-primary/10 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 mb-1 transition-transform",
                  active && "scale-110"
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
