// frontend/app/admin/page.tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminStore } from '@/store/admin-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Music, 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { formatBAKCoins, formatCurrency, cn } from '@/lib/utils';

export default function AdminDashboard() {
  const {
    platformMetrics,
    systemHealth,
    moderationQueue,
    securityAlerts,
    fetchPlatformMetrics,
    fetchSystemHealth,
    fetchModerationQueue,
    fetchSecurityAlerts,
    isLoading
  } = useAdminStore();

  useEffect(() => {
    fetchPlatformMetrics();
    fetchSystemHealth();
    fetchModerationQueue();
    fetchSecurityAlerts();
  }, [fetchPlatformMetrics, fetchSystemHealth, fetchModerationQueue, fetchSecurityAlerts]);

  if (isLoading && !platformMetrics) {
    return <DashboardSkeleton />;
  }

  const criticalAlerts = securityAlerts.filter(alert => alert.severity === 'CRITICAL');
  const pendingModeration = moderationQueue?.pendingTracks || 0;

  return (
    <div className="space-y-6">
      {/* System Status Banner */}
      {systemHealth?.status === 'CRITICAL' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-500">System Critical</h3>
              <p className="text-red-400 text-sm">
                {systemHealth.incidents[0]?.description || 'Multiple system components are experiencing issues'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-500/10">
            View Issues
          </Button>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={platformMetrics?.totalUsers.toLocaleString() || '0'}
          change={platformMetrics?.userGrowth || 0}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          href="/admin/users"
        />
        <StatCard
          title="Total Tracks"
          value={platformMetrics?.totalTracks.toLocaleString() || '0'}
          change={12.5}
          icon={<Music className="h-6 w-6 text-green-500" />}
          href="/admin/content"
        />
        <StatCard
          title="Active Competitions"
          value={platformMetrics?.totalCompetitions.toLocaleString() || '0'}
          change={8.2}
          icon={<Trophy className="h-6 w-6 text-yellow-500" />}
          href="/admin/competitions"
        />
        <StatCard
          title="Platform Revenue"
          value={formatBAKCoins(platformMetrics?.totalRevenue || 0)}
          change={platformMetrics?.revenueGrowth || 0}
          icon={<DollarSign className="h-6 w-6 text-green-500" />}
          href="/admin/financial"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card variant="glass" className="backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                System Health
              </CardTitle>
              <CardDescription>
                Real-time monitoring of platform components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Overall Status</div>
                      <div className={cn(
                        "text-sm capitalize",
                        systemHealth.status === 'HEALTHY' ? 'text-green-500' :
                        systemHealth.status === 'DEGRADED' ? 'text-yellow-500' :
                        'text-red-500'
                      )}>
                        {systemHealth.status.toLowerCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">{systemHealth.uptime}%</div>
                      <div className="text-sm text-gray-400">Uptime</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {systemHealth.components.map((component) => (
                      <div key={component.name} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            component.status === 'OPERATIONAL' ? 'bg-green-500' :
                            component.status === 'DEGRADED' ? 'bg-yellow-500' :
                            'bg-red-500'
                          )} />
                          <span className="text-sm text-white">{component.name}</span>
                        </div>
                        <div className="text-sm text-gray-400">{component.latency}ms</div>
                      </div>
                    ))}
                  </div>

                  {systemHealth.incidents.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-sm font-semibold text-white mb-2">Active Incidents</div>
                      {systemHealth.incidents.map((incident) => (
                        <div key={incident.id} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-white">{incident.title}</span>
                          </div>
                          <Badge variant="outline" className="text-red-500 border-red-500 text-xs">
                            {incident.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Loading system health...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Moderation Queue */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Moderation Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <QueueItem
                  label="Pending Tracks"
                  count={moderationQueue?.pendingTracks || 0}
                  href="/admin/content"
                  priority={pendingModeration > 10 ? 'HIGH' : 'MEDIUM'}
                />
                <QueueItem
                  label="Flagged Content"
                  count={moderationQueue?.flaggedContent || 0}
                  href="/admin/content"
                  priority={moderationQueue?.flaggedContent > 5 ? 'HIGH' : 'LOW'}
                />
                <QueueItem
                  label="Appeals"
                  count={moderationQueue?.appeals || 0}
                  href="/admin/content"
                  priority={moderationQueue?.appeals > 3 ? 'MEDIUM' : 'LOW'}
                />
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href="/admin/content">Review Content</a>
              </Button>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Security Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {criticalAlerts.length > 0 ? (
                <div className="space-y-3">
                  {criticalAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="font-medium text-white text-sm">{alert.title}</div>
                      <div className="text-xs text-red-400 mt-1">{alert.description}</div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-red-500 border-red-500 text-xs">
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(alert.detectedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No critical alerts</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href="/admin/security">View All Alerts</a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Key platform performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MetricRow
                label="Response Time"
                value={`${platformMetrics?.averageResponseTime || 0}ms`}
                trend="improving"
              />
              <MetricRow
                label="Error Rate"
                value={`${(platformMetrics?.errorRate || 0).toFixed(2)}%`}
                trend={platformMetrics?.errorRate > 1 ? 'worsening' : 'improving'}
              />
              <MetricRow
                label="AI Accuracy"
                value={`${(platformMetrics?.aiAccuracy || 0).toFixed(1)}%`}
                trend="stable"
              />
              <MetricRow
                label="Active Sessions"
                value={platformMetrics?.activeSessions.toLocaleString() || '0'}
                trend="improving"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used administrative actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col gap-1" asChild>
                <a href="/admin/users/invite">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Invite Admin</span>
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" asChild>
                <a href="/admin/system/config">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">System Config</span>
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" asChild>
                <a href="/admin/reports">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Generate Report</span>
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" asChild>
                <a href="/admin/system/cache">
                  <Zap className="h-5 w-5" />
                  <span className="text-xs">Clear Cache</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Supporting Components
function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  href 
}: { 
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  href: string;
}) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        variant="glass" 
        className="backdrop-blur-xl hover:bg-dark-700/50 transition-colors cursor-pointer"
        asChild
      >
        <a href={href}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-2">{title}</div>
                <div className="text-2xl font-bold text-white mb-1">{value}</div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  isPositive ? "text-green-500" : "text-red-500"
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {isPositive ? '+' : ''}{change}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-dark-700">
                {icon}
              </div>
            </div>
          </CardContent>
        </a>
      </Card>
    </motion.div>
  );
}

function QueueItem({ 
  label, 
  count, 
  href,
  priority 
}: { 
  label: string;
  count: number;
  href: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}) {
  const priorityColors = {
    LOW: 'text-green-500',
    MEDIUM: 'text-yellow-500',
    HIGH: 'text-red-500'
  };

  return (
    <a href={href} className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-700/50 transition-colors">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-sm font-semibold",
          count > 0 ? priorityColors[priority] : 'text-gray-400'
        )}>
          {count}
        </span>
        {count > 0 && (
          <div className={cn(
            "w-2 h-2 rounded-full",
            priorityColors[priority]
          )} />
        )}
      </div>
    </a>
  );
}

function MetricRow({ 
  label, 
  value, 
  trend 
}: { 
  label: string;
  value: string;
  trend: 'improving' | 'worsening' | 'stable';
}) {
  const trendIcons = {
    improving: <TrendingUp className="h-4 w-4 text-green-500" />,
    worsening: <TrendingDown className="h-4 w-4 text-red-500" />,
    stable: <div className="w-4 h-4 rounded-full bg-yellow-500" />
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{value}</span>
        {trendIcons[trend]}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-dark-700 rounded-xl"></div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-dark-700 rounded-xl"></div>
        <div className="space-y-6">
          <div className="h-40 bg-dark-700 rounded-xl"></div>
          <div className="h-40 bg-dark-700 rounded-xl"></div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-40 bg-dark-700 rounded-xl"></div>
        <div className="h-40 bg-dark-700 rounded-xl"></div>
      </div>
    </div>
  );
}

// Helper icon component
function Shield(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
