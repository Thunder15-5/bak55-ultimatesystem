import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Users, Coins, Trophy, Target, Award, Star,
  ShieldAlert, MessageSquare, Bell, FileText, UserPlus, Gift, Mail,
  Music2, ShoppingBag, Vote, ShieldCheck, Wallet, Package,
  LayoutDashboard, Eye, Settings, Megaphone, CircleDot,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingWithdrawals?: number;
  pendingPurchases?: number;
  pendingMerchOrders?: number;
}

const navGroups = [
  {
    label: "Operations",
    items: [
      { id: "metrics", label: "Overview", icon: LayoutDashboard },
      { id: "withdrawals", label: "Withdrawals", icon: Wallet, badge: "pendingWithdrawals" },
      { id: "purchases", label: "Purchases", icon: Coins, badge: "pendingPurchases" },
      { id: "sales", label: "Sales", icon: ShoppingBag },
      { id: "moderation", label: "Moderation", icon: Eye },
      { id: "trust-safety", label: "Trust & Safety", icon: ShieldAlert, external: "/admin/trust-safety" },
    ],
  },
  {
    label: "Competitions",
    items: [
      { id: "competitions", label: "Manage", icon: Trophy },
      { id: "stages", label: "Stages", icon: Target },
      { id: "voting", label: "Voting", icon: Vote },
      { id: "competition-report", label: "Reports", icon: BarChart3 },
      { id: "badges", label: "Badges", icon: Award },
    ],
  },
  {
    label: "Users",
    items: [
      { id: "users", label: "All Users", icon: Users },
      { id: "applications", label: "Applications", icon: UserPlus },
      { id: "producers", label: "Producers", icon: Music2 },
      { id: "subscriptions", label: "Subscriptions", icon: Star },
      { id: "featured", label: "Featured", icon: Star },
    ],
  },
  {
    label: "Communications",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "messages", label: "Messages", icon: MessageSquare },
      { id: "emails", label: "Email Templates", icon: Mail },
    ],
  },
  {
    label: "Settings & More",
    items: [
      { id: "system-settings", label: "System", icon: ShieldCheck },
      { id: "withdrawal-config", label: "Withdrawal Config", icon: ShieldAlert },
      { id: "artist-levels", label: "Artist Levels", icon: Award },
      { id: "merch-products", label: "Merch Products", icon: ShoppingBag },
      { id: "merch-orders", label: "Merch Orders", icon: Package, badge: "pendingMerchOrders" },
      { id: "referrals", label: "Referrals", icon: Gift },
      { id: "blog", label: "Blog", icon: FileText },
      { id: "early-access", label: "Leads", icon: Mail },
      { id: "activity-log", label: "Activity Log", icon: FileText },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, pendingWithdrawals = 0, pendingPurchases = 0, pendingMerchOrders = 0 }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const badgeCounts: Record<string, number> = {
    pendingWithdrawals,
    pendingPurchases,
    pendingMerchOrders,
  };

  const hasUrgent = pendingWithdrawals > 0 || pendingPurchases > 0;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-heading font-bold text-sm">BAK55 Admin</span>
              {hasUrgent && (
                <div className="flex items-center gap-1 mt-0.5">
                  <CircleDot className="h-2.5 w-2.5 text-destructive animate-pulse" />
                  <span className="text-[9px] text-destructive font-medium">Action needed</span>
                </div>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative mx-auto">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {hasUrgent && (
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const badgeCount = item.badge ? badgeCounts[item.badge] : 0;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={isActive}
                        tooltip={item.label}
                        className={`transition-all duration-150 ${isActive ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "hover:bg-muted/50"}`}
                      >
                        <div className="relative">
                          <Icon className="h-4 w-4 shrink-0" />
                          {collapsed && badgeCount > 0 && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </div>
                        {!collapsed && (
                          <span className="flex-1 flex items-center justify-between">
                            {item.label}
                            {badgeCount > 0 && (
                              <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-[10px] px-1.5 rounded-full">
                                {badgeCount}
                              </Badge>
                            )}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
