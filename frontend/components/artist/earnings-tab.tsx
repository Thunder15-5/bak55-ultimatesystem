// frontend/components/artist/earnings-tab.tsx
'use client';

import { motion } from 'framer-motion';
import { useArtistStore } from '@/store/artist-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  Calendar,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatBAKCoins, formatCurrency, cn } from '@/lib/utils';
import { RevenueType } from '@/types/artist';
import { useState } from 'react';

export function EarningsTab() {
  const {
    revenueStreams,
    profile,
    getRevenueProjections
  } = useArtistStore();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showAmounts, setShowAmounts] = useState(true);

  const totalRevenue = revenueStreams.reduce((sum, stream) => sum + stream.amount, 0);
  const revenueProjections = getRevenueProjections();

  const getRevenueColor = (type: RevenueType) => {
    switch (type) {
      case RevenueType.STREAMING: return 'from-blue-500 to-cyan-500';
      case RevenueType.COMPETITIONS: return 'from-purple-500 to-pink-500';
      case RevenueType.TIPS: return 'from-green-500 to-emerald-500';
      case RevenueType.ROYALTIES: return 'from-yellow-500 to-orange-500';
      case RevenueType.BRAND_DEALS: return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRevenueIcon = (type: RevenueType) => {
    switch (type) {
      case RevenueType.STREAMING: return '🎵';
      case RevenueType.COMPETITIONS: return '🏆';
      case RevenueType.TIPS: return '💝';
      case RevenueType.ROYALTIES: return '📜';
      case RevenueType.BRAND_DEALS: return '🤝';
      default: return '💰';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Earnings Overview</h2>
          <p className="text-gray-400">
            Track your revenue streams and financial growth
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAmounts(!showAmounts)}
            className="flex items-center gap-2"
          >
            {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAmounts ? 'Hide' : 'Show'} Amounts
          </Button>

          <div className="flex bg-dark-800 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-all",
                  timeRange === range
                    ? "bg-primary-500 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Total Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="premium" glow className="backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-2">Total Earnings</div>
                <div className="text-4xl font-bold gradient-text mb-2">
                  {showAmounts ? formatBAKCoins(totalRevenue) : '••••••'}
                </div>
                <div className="text-sm text-gray-400">
                  ≈ {showAmounts ? formatCurrency(totalRevenue * 0.2, 'KES') : '••••••'}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-semibold">+15.2%</span>
                </div>
                <div className="text-sm text-gray-400">vs last period</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Streams */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card variant="glass" className="backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-500" />
                Revenue Streams
              </CardTitle>
              <CardDescription>
                Breakdown of your income sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueStreams.map((stream, index) => (
                  <motion.div
                    key={stream.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center text-white text-lg",
                        getRevenueColor(stream.type)
                      )}>
                        {getRevenueIcon(stream.type)}
                      </div>
                      
                      <div>
                        <div className="font-semibold text-white capitalize">
                          {stream.type.toLowerCase().replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-400">
                          {stream.percentage}% of total
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {showAmounts ? formatBAKCoins(stream.amount) : '••••••'}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        stream.trend === 'UP' ? 'text-green-500' : 
                        stream.trend === 'DOWN' ? 'text-red-500' : 
                        'text-yellow-500'
                      )}>
                        {stream.trend === 'UP' ? <TrendingUp className="h-3 w-3" /> :
                         stream.trend === 'DOWN' ? <TrendingDown className="h-3 w-3" /> :
                         <div className="h-3 w-3 rounded-full bg-yellow-500" />}
                        {stream.change}%
                      </div>
                    </div>
                  </motion.div>
                ))}

                {revenueStreams.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <DollarSign className="h-12 w-12 mx-auto mb-4" />
                    <p>No revenue data yet</p>
                    <p className="text-sm">Start earning by uploading tracks and joining competitions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Projections */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {revenueProjections.map((projection, index) => (
                <div key={index} className="flex justify-between items-center p-2">
                  <div className="text-sm text-gray-400">{projection.period}</div>
                  <div className="text-right">
                    <div className="font-semibold text-green-500">
                      {showAmounts ? formatBAKCoins(projection.projectedRevenue) : '••••••'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(projection.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Performing */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Top Revenue Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueStreams
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3)
                .map((stream, index) => (
                  <div key={stream.type} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm text-gray-300 capitalize">
                        {stream.type.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {showAmounts ? formatBAKCoins(stream.amount) : '••••••'}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Earnings Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Avg per track</span>
                <span className="text-sm font-semibold text-white">
                  {showAmounts ? formatBAKCoins(totalRevenue / 10) : '••••••'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Daily avg</span>
                <span className="text-sm font-semibold text-white">
                  {showAmounts ? formatBAKCoins(totalRevenue / 30) : '••••••'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Growth rate</span>
                <span className="text-sm font-semibold text-green-500">+15.2%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
