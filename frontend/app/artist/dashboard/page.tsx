// frontend/app/artist/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useArtistStore } from '@/store/artist-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Star, 
  Zap,
  Calendar,
  MapPin,
  Clock,
  Award
} from 'lucide-react';
import { formatBAKCoins, formatCurrency, cn } from '@/lib/utils';
import { OverviewTab } from '@/components/artist/overview-tab';
import { MusicTab } from '@/components/artist/music-tab';
import { CompetitionsTab } from '@/components/artist/competitions-tab';
import { EarningsTab } from '@/components/artist/earnings-tab';
import { AudienceTab } from '@/components/artist/audience-tab';
import { CareerTab } from '@/components/artist/career-tab';

export default function ArtistDashboard() {
  const {
    profile,
    fetchArtistProfile,
    fetchAnalytics,
    fetchRevenueStreams,
    fetchAudienceDemographics,
    fetchCompetitionHistory,
    activeTab,
    isLoading
  } = useArtistStore();

  useEffect(() => {
    fetchArtistProfile();
    fetchAnalytics();
    fetchRevenueStreams();
    fetchAudienceDemographics();
    fetchCompetitionHistory();
  }, []);

  if (isLoading && !profile) {
    return <DashboardSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Card variant="glass" className="text-center p-8">
          <CardContent>
            <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Artist Profile Not Found</h2>
            <p className="text-gray-400 mb-6">
              Complete your artist profile to access the dashboard
            </p>
            <Button asChild>
              <a href="/artist/profile">Complete Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900/30 to-secondary-900/30 border-b border-luxury-glass-border">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              {/* Artist Avatar */}
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                  <Music className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <Badge variant="primary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {profile.talentScore?.toFixed(1) || 'N/A'}
                  </Badge>
                </div>
              </div>

              {/* Artist Info */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {profile.user.stageName || profile.user.username}
                </h1>
                <p className="text-gray-400 mb-4 max-w-2xl">
                  {profile.user.bio || 'No bio yet. Add a bio to tell fans about your music journey.'}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    {profile.user.location || 'Location not set'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.joinedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Award className="h-4 w-4" />
                    {profile.careerStage}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 min-w-max">
              <StatCard
                icon={<Users className="h-5 w-5 text-blue-500" />}
                value={profile.monthlyListeners.toLocaleString()}
                label="Monthly Listeners"
                trend="up"
              />
              <StatCard
                icon={<DollarSign className="h-5 w-5 text-green-500" />}
                value={formatBAKCoins(profile.totalEarnings)}
                label="Total Earnings"
                trend="up"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                value={`${profile.engagementRate}%`}
                label="Engagement Rate"
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
              <TabTrigger value="overview" icon={<TrendingUp className="h-4 w-4" />}>
                Overview
              </TabTrigger>
              <TabTrigger value="music" icon={<Music className="h-4 w-4" />}>
                Music
              </TabTrigger>
              <TabTrigger value="competitions" icon={<Trophy className="h-4 w-4" />}>
                Competitions
              </TabTrigger>
              <TabTrigger value="earnings" icon={<DollarSign className="h-4 w-4" />}>
                Earnings
              </TabTrigger>
              <TabTrigger value="audience" icon={<Users className="h-4 w-4" />}>
                Audience
              </TabTrigger>
              <TabTrigger value="career" icon={<Target className="h-4 w-4" />}>
                Career
              </TabTrigger>
            </TabsList>
          </motion.div>

          {/* Tab Contents */}
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="music">
            <MusicTab />
          </TabsContent>

          <TabsContent value="competitions">
            <CompetitionsTab />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsTab />
          </TabsContent>

          <TabsContent value="audience">
            <AudienceTab />
          </TabsContent>

          <TabsContent value="career">
            <CareerTab />
          </TabsContent>
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

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingUp className="h-4 w-4 rotate-180" />,
    stable: <Zap className="h-4 w-4" />
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
          <div className={cn("flex items-center gap-1", trendColors[trend])}>
            {trendIcons[trend]}
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
  const { activeTab } = useArtistStore();
  
  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "flex items-center gap-2 py-3 px-4 rounded-xl transition-all",
        activeTab === value 
          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25" 
          : "text-gray-400 hover:text-white hover:bg-dark-700"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </TabsTrigger>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dark-900 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-primary-900/30 to-secondary-900/30 border-b border-luxury-glass-border">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-dark-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
