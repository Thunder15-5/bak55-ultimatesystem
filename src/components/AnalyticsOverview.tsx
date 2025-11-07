import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Music, DollarSign, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: any;
}

interface AnalyticsOverviewProps {
  stats: {
    totalPlays: number;
    totalEarnings: number;
    followers: number;
    tracks: number;
    avgPlaysPerTrack: string;
  };
}

export function AnalyticsOverview({ stats }: AnalyticsOverviewProps) {
  const overviewStats: Stat[] = [
    {
      label: "Total Plays",
      value: stats.totalPlays.toLocaleString(),
      icon: Music,
      trend: 'up'
    },
    {
      label: "Total Earnings",
      value: `${stats.totalEarnings.toLocaleString()} BAKCoins`,
      icon: DollarSign,
      trend: 'up'
    },
    {
      label: "Followers",
      value: stats.followers.toLocaleString(),
      icon: Users,
      trend: 'up'
    },
    {
      label: "Total Tracks",
      value: stats.tracks,
      icon: Music,
    },
    {
      label: "Avg Plays/Track",
      value: stats.avgPlaysPerTrack,
      icon: Heart,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {overviewStats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    Growing
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
