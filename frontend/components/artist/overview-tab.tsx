// frontend/components/artist/overview-tab.tsx
'use client';

import { motion } from 'framer-motion';
import { useArtistStore } from '@/store/artist-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Play, 
  Heart, 
  Share, 
  DollarSign,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';
import { formatBAKCoins, cn } from '@/lib/utils';

export function OverviewTab() {
  const {
    profile,
    analytics,
    getGrowthMetrics,
    getEngagementMetrics,
    getRevenueProjections,
    careerInsights
  } = useArtistStore();

  const growthMetrics = getGrowthMetrics();
  const engagementMetrics = getEngagementMetrics();
  const revenueProjections = getRevenueProjections();

  if (!profile || !analytics) {
    return <div>Loading...</div>;
  }

  const topInsights = careerInsights.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Listener Growth"
          value={growthMetrics.listenerGrowth}
          isPositive={growthMetrics.listenerGrowth > 0}
          icon={<Users className="h-6 w-6" />}
          description="Monthly listeners"
        />
        <MetricCard
          title="Revenue Growth"
          value={growthMetrics.revenueGrowth}
          isPositive={growthMetrics.revenueGrowth > 0}
          icon={<DollarSign className="h-6 w-6" />}
          description="Monthly revenue"
        />
        <MetricCard
          title="Engagement Growth"
          value={growthMetrics.engagementGrowth}
          isPositive={growthMetrics.engagementGrowth > 0}
          icon={<TrendingUp className="h-6 w-6" />}
          description="Overall engagement"
        />
        <MetricCard
          title="Talent Score"
          value={profile.talentScore || 0}
          isPositive={true}
          icon={<Target className="h-6 w-6" />}
          description="AI assessment"
          isScore={true}
        />
      </motion.div>

      {/* Engagement Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <MiniMetric
          title="Avg Play Duration"
          value={`${engagementMetrics.avgPlayDuration}%`}
          icon={<Play className="h-4 w-4" />}
        />
        <MiniMetric
          title="Completion Rate"
          value={`${engagementMetrics.completionRate}%`}
          icon={<Target className="h-4 w-4" />}
        />
        <MiniMetric
          title="Share Rate"
          value={`${engagementMetrics.shareRate}%`}
          icon={<Share className="h-4 w-4" />}
        />
        <MiniMetric
          title="Tip Rate"
          value={`${engagementMetrics.tipRate}%`}
          icon={<Heart className="h-4 w-4" />}
        />
        <MiniMetric
          title="Repeat Listeners"
          value={`${engagementMetrics.repeatListenerRate}%`}
          icon={<Users className="h-4 w-4" />}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Projections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card variant="glass" className="backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Revenue Projections
              </CardTitle>
              <CardDescription>
                AI-powered revenue forecasts based on your growth trajectory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueProjections.map((projection, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                    <div>
                      <div className="font-semibold text-white">{projection.period}</div>
                      <div className="text-sm text-gray-400">
                        Confidence: {(projection.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-500">
                        {formatBAKCoins(projection.projectedRevenue)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {projection.factors.length} factors considered
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Career Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass" className="backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Personalized recommendations for growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topInsights.length > 0 ? (
                  topInsights.map((insight, index) => (
                    <div key={insight.id} className="p-3 bg-dark-800/50 rounded-lg border-l-4 border-l-yellow-500">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {insight.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {insight.description}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "mt-2 text-xs",
                              insight.priority === 'HIGH' && "border-red-500 text-red-500",
                              insight.priority === 'MEDIUM' && "border-yellow-500 text-yellow-500",
                              insight.priority === 'LOW' && "border-green-500 text-green-500"
                            )}
                          >
                            {insight.priority.toLowerCase()} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p>No insights yet</p>
                    <p className="text-sm">Complete more activities to get personalized recommendations</p>
                  </div>
                )}
                
                {topInsights.length > 0 && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/artist/career">View All Insights</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Button asChild variant="outline" className="h-16 flex-col gap-2">
          <a href="/artist/upload">
            <Upload className="h-5 w-5" />
            Upload Track
          </a>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-2">
          <a href="/competitions">
            <Trophy className="h-5 w-5" />
            Join Competition
          </a>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-2">
          <a href="/artist/audience">
            <Users className="h-5 w-5" />
            Audience Insights
          </a>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-2">
          <a href="/artist/career">
            <Target className="h-5 w-5" />
            Career Plan
          </a>
        </Button>
      </motion.div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  isPositive, 
  icon, 
  description,
  isScore = false 
}: {
  title: string;
  value: number;
  isPositive: boolean;
  icon: React.ReactNode;
  description: string;
  isScore?: boolean;
}) {
  const displayValue = isScore 
    ? value.toFixed(1)
    : value > 0 
      ? `+${value.toFixed(1)}%`
      : `${value.toFixed(1)}%`;

  return (
    <Card variant="glass" className="backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-dark-700">
            {icon}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-semibold",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {!isScore && (isPositive ? 'Growing' : 'Declining')}
          </div>
        </div>
        
        <div className="text-3xl font-bold text-white mb-1">
          {displayValue}
        </div>
        <div className="text-sm text-gray-400">
          {description}
        </div>
        
        {isScore && (
          <div className="mt-3 w-full bg-dark-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(value / 10) * 100}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniMetric({ title, value, icon }: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card variant="glass" className="backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-dark-700">
            {icon}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{value}</div>
            <div className="text-xs text-gray-400">{title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper icon component
function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function Trophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
