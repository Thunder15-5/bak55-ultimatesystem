import { useLocation } from "react-router-dom";
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
  BarChart3, Users, DollarSign, Coins, Trophy, Target, Award, Star,
  ShieldAlert, MessageSquare, Bell, FileText, UserPlus, Gift, Mail,
  Music2, ShoppingBag, Vote, ShieldCheck, Wallet, Package, Truck,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingWithdrawals?: number;
  pendingPurchases?: number;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { id: "metrics", label: "Dashboard", icon: BarChart3 },
    ],
  },
  {
    label: "Financial",
    items: [
      { id: "withdrawals", label: "Withdrawals", icon: Wallet, badge: "pendingWithdrawals" },
      { id: "purchases", label: "Purchases", icon: Coins, badge: "pendingPurchases" },
      { id: "sales", label: "Sales", icon: ShoppingBag },
    ],
  },
  {
    label: "Users & Roles",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "applications", label: "Applications", icon: UserPlus },
      { id: "producers", label: "Producers", icon: Music2 },
      { id: "subscriptions", label: "Subscriptions", icon: DollarSign },
    ],
  },
  {
    label: "Competitions",
    items: [
      { id: "competitions", label: "Competitions", icon: Trophy },
      { id: "stages", label: "Stages", icon: Target },
      { id: "voting", label: "Voting", icon: Vote },
      { id: "competition-report", label: "Reports", icon: BarChart3 },
      { id: "badges", label: "Badges", icon: Award },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "moderation", label: "Moderation", icon: ShieldAlert },
      { id: "featured", label: "Featured", icon: Star },
    ],
  },
  {
    label: "Communications",
    items: [
      { id: "messages", label: "Messages", icon: MessageSquare },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "emails", label: "Emails", icon: Mail },
    ],
  },
  {
    label: "Merch Store",
    items: [
      { id: "merch-products", label: "Products", icon: ShoppingBag },
      { id: "merch-orders", label: "Orders", icon: Package, badge: "pendingMerchOrders" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { id: "withdrawal-config", label: "Withdrawal Config", icon: ShieldAlert },
      { id: "artist-levels", label: "Artist Levels", icon: Award },
    ],
  },
  {
    label: "System",
    items: [
      { id: "referrals", label: "Referrals", icon: Gift },
      { id: "early-access", label: "Leads", icon: Mail },
      { id: "activity-log", label: "Activity Log", icon: FileText },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, pendingWithdrawals = 0, pendingPurchases = 0 }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const badgeCounts: Record<string, number> = {
    pendingWithdrawals,
    pendingPurchases,
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-lg">Admin</span>
          </div>
        )}
        {collapsed && <ShieldCheck className="h-5 w-5 text-primary mx-auto" />}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
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
                        className={`transition-colors ${isActive ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted/50"}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex-1 flex items-center justify-between">
                            {item.label}
                            {badgeCount > 0 && (
                              <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-[10px] px-1.5">
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
