// frontend/components/ai/talent-score-gauge.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AITalentAnalysis, AIScoreDimension } from '@/types/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface TalentScoreGaugeProps {
  analysis: AITalentAnalysis;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBreakdown?: boolean;
  interactive?: boolean;
  className?: string;
}

export function TalentScoreGauge({ 
  analysis, 
  size = 'md', 
  showBreakdown = true,
  interactive = true,
  className 
}: TalentScoreGaugeProps) {
  const { overallScore, scoreBreakdown } = analysis;
  
  const sizes = {
    sm: { gauge: 120, text: 'text-lg', breakdown: 'text-xs' },
    md: { gauge: 160, text: 'text-2xl', breakdown: 'text-sm' },
    lg: { gauge: 200, text: 'text-3xl', breakdown: 'text-base' },
    xl: { gauge: 240, text: 'text-4xl', breakdown: 'text-lg' }
  };

  const currentSize = sizes[size];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-500';
    if (score >= 6) return 'from-yellow-500 to-amber-500';
    if (score >= 4) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Exceptional';
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Very Good';
    if (score >= 6) return 'Good';
    if (score >= 5) return 'Average';
    if (score >= 4) return 'Below Average';
    return 'Needs Work';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (overallScore / 10) * circumference;

  return (
    <TooltipProvider>
      <div className={cn('relative', className)}>
        {/* Main Gauge */}
        <Card variant="glass" className="backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Circular Gauge */}
              <div className="relative" style={{ width: currentSize.gauge, height: currentSize.gauge }}>
                <svg 
                  width={currentSize.gauge} 
                  height={currentSize.gauge} 
                  className="transform -rotate-90"
                >
                  {/* Background Circle */}
                  <circle
                    cx={currentSize.gauge / 2}
                    cy={currentSize.gauge / 2}
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  
                  {/* Progress Circle */}
                  <motion.circle
                    cx={currentSize.gauge / 2}
                    cy={currentSize.gauge / 2}
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className={cn(getScoreColor(overallScore))}
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ 
                      duration: 2, 
                      ease: "easeOut",
                      delay: 0.5 
                    }}
                    strokeLinecap="round"
                  />
                  
                  {/* Gradient Overlay */}
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className="text-green-500" />
                      <stop offset="50%" className="text-yellow-500" />
                      <stop offset="100%" className="text-red-500" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="text-center"
                  >
                    <div className={cn(
                      "font-bold gradient-text",
                      currentSize.text
                    )}>
                      {overallScore.toFixed(1)}
                    </div>
                    <div className={cn(
                      "font-semibold capitalize",
                      getScoreColor(overallScore),
                      currentSize.breakdown
                    )}>
                      {getScoreLabel(overallScore)}
                    </div>
                  </motion.div>
                </div>

                {/* Confidence Indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          analysis.confidence > 0.8 ? "text-green-500" :
                          analysis.confidence > 0.6 ? "text-yellow-500" :
                          "text-red-500"
                        )}
                      >
                        <Zap className="h-3 w-3" />
                        {(analysis.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI Confidence Score</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Score Breakdown */}
              {showBreakdown && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="w-full space-y-3"
                >
                  {Object.entries(scoreBreakdown).map(([category, dimension]) => (
                    <ScoreBar 
                      key={category}
                      category={category}
                      dimension={dimension}
                      size={size}
                      interactive={interactive}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Genre Benchmark Badge */}
        <div className="absolute -top-2 -right-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Top {100 - analysis.genreBenchmark.percentile}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Better than {100 - analysis.genreBenchmark.percentile}% of {analysis.genreBenchmark.topArtists[0]} artists</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Individual Score Bar Component
function ScoreBar({ 
  category, 
  dimension, 
  size,
  interactive 
}: { 
  category: string; 
  dimension: AIScoreDimension;
  size: string;
  interactive: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vocalQuality': return '🎤';
      case 'musicality': return '🎵';
      case 'originality': return '✨';
      case 'productionQuality': return '🎛️';
      case 'marketPotential': return '📈';
      default: return '⭐';
    }
  };

  const getCategoryColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatCategoryName = (category: string) => {
    return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-3 p-2 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors cursor-pointer"
          onMouseEnter={() => interactive && setIsHovered(true)}
          onMouseLeave={() => interactive && setIsHovered(false)}
        >
          {/* Category Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-sm">
            {getCategoryIcon(category)}
          </div>

          {/* Category Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white capitalize">
                {formatCategoryName(category)}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  dimension.confidence > 0.8 ? "text-green-500" :
                  dimension.confidence > 0.6 ? "text-yellow-500" :
                  "text-red-500"
                )}
              >
                {(dimension.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-dark-700 rounded-full h-2 mt-1">
              <motion.div
                className={cn("h-2 rounded-full transition-all", getCategoryColor(dimension.score))}
                initial={{ width: 0 }}
                animate={{ width: `${(dimension.score / 10) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <div className={cn(
              "font-bold",
              dimension.score >= 8 ? "text-green-500" :
              dimension.score >= 6 ? "text-yellow-500" :
              dimension.score >= 4 ? "text-orange-500" :
              "text-red-500"
            )}>
              {dimension.score.toFixed(1)}
            </div>
            {dimension.trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                dimension.trend === 'IMPROVING' ? "text-green-500" :
                dimension.trend === 'DECLINING' ? "text-red-500" :
                "text-yellow-500"
              )}>
                {dimension.trend === 'IMPROVING' ? <TrendingUp className="h-3 w-3" /> :
                 dimension.trend === 'DECLINING' ? <TrendingDown className="h-3 w-3" /> :
                 <div className="w-3 h-3 rounded-full bg-yellow-500" />}
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      
      <TooltipContent className="max-w-sm p-4">
        <div className="space-y-2">
          <div className="font-semibold text-white capitalize">
            {formatCategoryName(category)}
          </div>
          <div className="text-sm text-gray-300">
            {dimension.explanation}
          </div>
          
          {/* Key Factors */}
          <div className="space-y-1">
            {dimension.factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  factor.score >= 8 ? "bg-green-500" :
                  factor.score >= 6 ? "bg-yellow-500" :
                  "bg-red-500"
                )} />
                <span className="text-gray-400">{factor.aspect}:</span>
                <span className="text-white">{factor.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
