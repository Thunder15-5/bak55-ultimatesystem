// frontend/components/ai/ai-analysis-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AITalentAnalysis, ImprovementArea, CareerSuggestion } from '@/types/ai';
import { useAIAnalysisStore } from '@/store/ai-analysis-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TalentScoreGauge } from '@/components/ai/talent-score-gauge';
import { 
  Star, 
  Target, 
  TrendingUp, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Clock,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAnalysisDashboardProps {
  trackId: string;
  artistId: string;
  autoRefresh?: boolean;
  className?: string;
}

export function AIAnalysisDashboard({ 
  trackId, 
  artistId, 
  autoRefresh = false,
  className 
}: AIAnalysisDashboardProps) {
  const {
    currentAnalysis,
    isLoading,
    error,
    fetchAnalysis,
    startRealTimeAnalysis,
    stopRealTimeAnalysis
  } = useAIAnalysisStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  useEffect(() => {
    fetchAnalysis(trackId, artistId);
  }, [trackId, artistId, fetchAnalysis]);

  useEffect(() => {
    if (autoRefresh && realTimeEnabled && currentAnalysis) {
      const interval = setInterval(() => {
        fetchAnalysis(trackId, artistId);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, realTimeEnabled, trackId, artistId, fetchAnalysis, currentAnalysis]);

  const handleRealTimeToggle = async () => {
    if (realTimeEnabled) {
      stopRealTimeAnalysis(trackId);
      setRealTimeEnabled(false);
    } else {
      await startRealTimeAnalysis(trackId, {
        enabled: true,
        updateFrequency: 5000,
        metrics: [],
        thresholds: { quality: 7, originality: 6, marketFit: 6 }
      });
      setRealTimeEnabled(true);
    }
  };

  if (isLoading && !currentAnalysis) {
    return <AnalysisSkeleton />;
  }

  if (error) {
    return (
      <Card variant="glass" className={className}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => fetchAnalysis(trackId, artistId)}>
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentAnalysis) {
    return (
      <Card variant="glass" className={className}>
        <CardContent className="p-8 text-center">
          <Zap className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis Available</h3>
          <p className="text-gray-400">AI analysis will be generated after track processing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            AI Talent Analysis
          </h2>
          <p className="text-gray-400">
            Comprehensive assessment of musical talent and potential
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={realTimeEnabled ? "primary" : "outline"}
            size="sm"
            onClick={handleRealTimeToggle}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {realTimeEnabled ? 'Real-time On' : 'Enable Real-time'}
          </Button>

          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            v{currentAnalysis.analysisVersion}
          </Badge>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Navigation */}
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 p-1 bg-dark-800/50 rounded-2xl backdrop-blur-xl">
          <TabTrigger value="overview" icon={<Star className="h-4 w-4" />}>
            Overview
          </TabTrigger>
          <TabTrigger value="strengths" icon={<Award className="h-4 w-4" />}>
            Strengths
          </TabTrigger>
          <TabTrigger value="improvements" icon={<Target className="h-4 w-4" />}>
            Improvements
          </TabTrigger>
          <TabTrigger value="career" icon={<TrendingUp className="h-4 w-4" />}>
            Career
          </TabTrigger>
          <TabTrigger value="market" icon={<Users className="h-4 w-4" />}>
            Market
          </TabTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Talent Score Gauge */}
            <TalentScoreGauge 
              analysis={currentAnalysis} 
              size="lg"
              showBreakdown={true}
            />

            {/* Key Insights */}
            <Card variant="glass" className="backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strengths */}
                <div>
                  <h4 className="font-semibold text-green-500 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Key Strengths
                  </h4>
                  <div className="space-y-2">
                    {currentAnalysis.strengths.slice(0, 3).map((strength, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-300">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Wins */}
                <div>
                  <h4 className="font-semibold text-orange-500 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Wins
                  </h4>
                  <div className="space-y-2">
                    {currentAnalysis.improvements
                      .filter(imp => imp.priority === 'HIGH')
                      .slice(0, 2)
                      .map((improvement, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-300">{improvement.actionSteps[0]}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Genre Comparison */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Genre Comparison</CardTitle>
              <CardDescription>
                How you stack up against other artists in your genre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatComparison
                  label="Your Score"
                  value={currentAnalysis.overallScore}
                  comparison={currentAnalysis.genreBenchmark.average}
                  isPositive={currentAnalysis.overallScore > currentAnalysis.genreBenchmark.average}
                />
                <StatComparison
                  label="Genre Average"
                  value={currentAnalysis.genreBenchmark.average}
                  comparison={currentAnalysis.overallScore}
                  isPositive={currentAnalysis.genreBenchmark.average < currentAnalysis.overallScore}
                />
                <StatComparison
                  label="Percentile Rank"
                  value={currentAnalysis.genreBenchmark.percentile}
                  isPercentage={true}
                  isPositive={currentAnalysis.genreBenchmark.percentile > 50}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strengths Tab */}
        <TabsContent value="strengths">
          <StrengthsTab analysis={currentAnalysis} />
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements">
          <ImprovementsTab analysis={currentAnalysis} />
        </TabsContent>

        {/* Career Tab */}
        <TabsContent value="career">
          <CareerTab analysis={currentAnalysis} />
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market">
          <MarketTab analysis={currentAnalysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Supporting Components
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
      {children}
    </TabsTrigger>
  );
}

function StatComparison({ 
  label, 
  value, 
  comparison, 
  isPercentage = false,
  isPositive 
}: { 
  label: string;
  value: number;
  comparison?: number;
  isPercentage?: boolean;
  isPositive?: boolean;
}) {
  const difference = comparison ? value - comparison : 0;
  
  return (
    <Card variant="glass">
      <CardContent className="p-4 text-center">
        <div className="text-sm text-gray-400 mb-2">{label}</div>
        <div className="text-2xl font-bold text-white mb-1">
          {isPercentage ? `${value.toFixed(1)}%` : value.toFixed(1)}
        </div>
        {comparison !== undefined && (
          <div className={cn(
            "text-sm flex items-center justify-center gap-1",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {difference > 0 ? '+' : ''}{difference.toFixed(1)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-dark-700 rounded w-48"></div>
          <div className="h-4 bg-dark-700 rounded w-96"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-dark-700 rounded w-32"></div>
          <div className="h-6 bg-dark-700 rounded w-20"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-dark-700 rounded-xl"></div>
        <div className="h-80 bg-dark-700 rounded-xl"></div>
      </div>
      
      <div className="h-40 bg-dark-700 rounded-xl"></div>
    </div>
  );
}

// Additional Tab Components would be implemented similarly...
// StrengthsTab, ImprovementsTab, CareerTab, MarketTab
