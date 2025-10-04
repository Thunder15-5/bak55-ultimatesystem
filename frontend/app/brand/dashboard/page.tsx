// frontend/app/brand/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBrandStore } from '@/store/brand-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Zap,
  Calendar,
  Award,
  BarChart3,
  FileText
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { CampaignStatus, CampaignType } from '@/types/brand';

export default function BrandDashboard() {
  const {
    brandProfile,
    campaigns,
    analytics,
    fetchBrandProfile,
    fetchAnalytics,
    isLoading
  } = useBrandStore();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchBrandProfile();
    fetchAnalytics(timeframe);
  }, [fetchBrandProfile, fetchAnalytics, timeframe]);

  if (isLoading && !brandProfile) {
    return <DashboardSkeleton />;
  }

  if (!brandProfile) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <CardContent>
            <Building className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Brand Profile Not Found</h2>
            <p className="text-gray-400 mb-6">
              Complete your brand profile to access the enterprise dashboard
            </p>
            <Button asChild>
              <a href="/brand/profile">Complete Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED');
  const totalInvestment = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900/30 to-blue-900/30 border-b border-luxury-glass-border">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              {/* Brand Logo */}
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  {brandProfile.logo ? (
                    <img 
                      src={brandProfile.logo} 
                      alt={brandProfile.companyName}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <Building className="h-10 w-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <Badge 
                    variant={
                      brandProfile.verificationStatus === 'VERIFIED' ? 'primary' : 
                      brandProfile.verificationStatus === 'PENDING' ? 'secondary' : 
                      'danger'
                    } 
                    className="flex items-center gap-1"
                  >
                    <Award className="h-3 w-3" />
                    {brandProfile.verificationStatus.toLowerCase()}
                  </Badge>
                </div>
              </div>

              {/* Brand Info */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {brandProfile.companyName}
                </h1>
                <p className="text-gray-400 mb-4 max-w-2xl">
                  {brandProfile.description}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Target className="h-4 w-4" />
                    {brandProfile.industry}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    {brandProfile.socialMediaReach.toLocaleString()} reach
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(brandProfile.brandValue, 'USD')} brand value
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 min-w-max">
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                value={brandProfile.totalCampaigns.toString()}
                label="Total Campaigns"
                trend="up"
              />
              <StatCard
                icon={<DollarSign className="h-5 w-5 text-blue-500" />}
                value={formatCurrency(totalInvestment, 'USD')}
                label="Total Investment"
                trend="up"
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-yellow-500" />}
                value={`${brandProfile.successRate}%`}
                label="Success Rate"
                trend="stable"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-2 p-1 bg-dark-800/50 rounded-2xl backdrop-blur-xl">
              <TabTrigger value="overview" icon={<BarChart3 className="h-4 w-4" />}>
                Overview
              </TabTrigger>
              <TabTrigger value="campaigns" icon={<Target className="h-4 w-4" />}>
                Campaigns
              </TabTrigger>
              <TabTrigger value="artists" icon={<Users className="h-4 w-4" />}>
                Artists
              </TabTrigger>
              <TabTrigger value="analytics" icon={<TrendingUp className="h-4 w-4" />}>
                Analytics
              </TabTrigger>
              <TabTrigger value="contracts" icon={<FileText className="h-4 w-4" />}>
                Contracts
              </TabTrigger>
              <TabTrigger value="templates" icon={<Zap className="h-4 w-4" />}>
                Templates
              </TabTrigger>
            </TabsList>
          </motion.div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab 
              brandProfile={brandProfile}
              campaigns={campaigns}
              analytics={analytics}
            />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <CampaignsTab campaigns={campaigns} />
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
        </Tabs>
      </div>
    </div>
  );
}

// Supporting Components
function StatCard({ icon, value, label, trend }: { 
  icon: React.ReactNode; 
  value: string; 
  label: string; 
  trend: 'up' | 'down' | 'stable' 
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-yellow-500'
  };

  return (
    <Card variant="glass" className="backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dark-700">
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          </div>
          <div className={trendColors[trend]}>
            {trend === 'up' && <TrendingUp className="h-5 w-5" />}
            {trend === 'down' && <TrendingUp className="h-5 w-5 rotate-180" />}
            {trend === 'stable' && <Zap className="h-5 w-5" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TabTrigger({ value, icon, children }: { 
  value: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger 
      value={value} 
      className="flex items-center gap-2 py-3 px-4 rounded-xl transition-all data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-500/25 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-dark-700"
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </TabsTrigger>
  );
}

function OverviewTab({ brandProfile, campaigns, analytics }: any) {
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE');
  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Campaign Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card variant="premium" glow className="backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {activeCampaigns.length}
            </div>
            <div className="text-sm text-gray-400">
              {campaigns.length} total campaigns
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {formatCurrency(
                campaigns.reduce((sum: number, c: any) => sum + c.budget, 0),
                'USD'
              )}
            </div>
            <div className="text-sm text-gray-400">
              Across all campaigns
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {brandProfile.successRate}%
            </div>
            <div className="text-sm text-gray-400">
              Campaign performance
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>
                Your latest brand partnership initiatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.map((campaign: any) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                        campaign.status === 'ACTIVE' ? 'bg-green-500' :
                        campaign.status === 'COMPLETED' ? 'bg-blue-500' :
                        'bg-gray-500'
                      )}>
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {campaign.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {campaign.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {formatCurrency(campaign.budget, 'USD')}
                      </div>
                      <Badge 
                        variant={
                          campaign.status === 'ACTIVE' ? 'success' :
                          campaign.status === 'COMPLETED' ? 'primary' :
                          'outline'
                        }
                        className="text-xs capitalize"
                      >
                        {campaign.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}

                {recentCampaigns.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="h-12 w-12 mx-auto mb-4" />
                    <p>No campaigns yet</p>
                    <p className="text-sm">Create your first campaign to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start h-12">
                <a href="/brand/campaigns/create">
                  <Target className="h-4 w-4 mr-2" />
                  Create New Campaign
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-12">
                <a href="/brand/artists">
                  <Users className="h-4 w-4 mr-2" />
                  Find Artists
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-12">
                <a href="/brand/templates">
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-12">
                <a href="/brand/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Performance Snapshot */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Performance Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Avg. ROI</span>
                <span className="text-sm font-semibold text-green-500">
                  +{brandProfile.avgROI}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Artist Satisfaction</span>
                <span className="text-sm font-semibold text-yellow-500">
                  {analytics?.overview?.artistSatisfaction || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Campaign Success</span>
                <span className="text-sm font-semibold text-blue-500">
                  {brandProfile.successRate}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dark-900 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-primary-900/30 to-blue-900/30 border-b border-luxury-glass-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-dark-700 rounded-2xl"></div>
              <div className="space-y-3">
                <div className="h-8 bg-dark-700 rounded w-48"></div>
                <div className="h-4 bg-dark-700 rounded w-96"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-dark-700 rounded w-24"></div>
                  <div className="h-4 bg-dark-700 rounded w-24"></div>
                  <div className="h-4 bg-dark-700 rounded w-24"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-32 h-20 bg-dark-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="h-12 bg-dark-700 rounded-2xl w-full"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-dark-700 rounded-xl"></div>
            <div className="h-32 bg-dark-700 rounded-xl"></div>
            <div className="h-32 bg-dark-700 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-dark-700 rounded-xl"></div>
            <div className="h-64 bg-dark-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
