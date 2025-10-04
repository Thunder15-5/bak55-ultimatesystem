// frontend/components/recommendation/recommendation-feed.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecommendationStore } from '@/store/recommendation-store';
import { Recommendation, RecommendationType } from '@/types/recommendation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Users, 
  Zap, 
  Compass, 
  TrendingUp, 
  Heart,
  SkipForward,
  Share,
  Clock,
  Star,
  Loader
} from 'lucide-react';
import { cn, formatBAKCoins } from '@/lib/utils';
import { AudioPlayerMini } from '@/components/audio/audio-player-mini';

interface RecommendationFeedProps {
  autoRefresh?: boolean;
  showFilters?: boolean;
  maxRecommendations?: number;
  className?: string;
}

export function RecommendationFeed({ 
  autoRefresh = true,
  showFilters = true,
  maxRecommendations = 50,
  className 
}: RecommendationFeedProps) {
  const {
    currentRecommendations,
    discoverySession,
    isLoading,
    error,
    activeTab,
    fetchRecommendations,
    startDiscoverySession,
    endDiscoverySession,
    recordFeedback,
    updateContext
  } = useRecommendationStore();

  const [visibleRecommendations, setVisibleRecommendations] = useState<Recommendation[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter recommendations by active tab
  const filteredRecommendations = currentRecommendations.filter(rec => {
    switch (activeTab) {
      case 'for-you':
        return rec.relevanceScore > 0.7;
      case 'discovery':
        return rec.novelty > 0.6;
      case 'trending':
        return rec.source === 'TRENDING';
      case 'mood':
        return rec.type === 'MOOD';
      case 'genre':
        return rec.type === 'GENRE';
      default:
        return true;
    }
  });

  useEffect(() => {
    // Initial load
    fetchRecommendations({
      timeOfDay: getTimeOfDay(),
      activity: 'LISTENING',
      device: getDeviceType(),
      connection: 'WIFI'
    });

    // Start discovery session
    startDiscoverySession({
      timeOfDay: getTimeOfDay(),
      activity: 'LISTENING',
      device: getDeviceType(),
      connection: 'WIFI'
    });
  }, []);

  useEffect(() => {
    // Pagination logic
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    setVisibleRecommendations(filteredRecommendations.slice(startIndex, endIndex));
  }, [filteredRecommendations, page]);

  useEffect(() => {
    // Infinite scroll setup
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading]);

  const handleFeedback = (recommendationId: string, type: string) => {
    recordFeedback({
      type: type as any,
      recommendationId,
      metadata: { tab: activeTab }
    });
  };

  const getRecommendationIcon = (type: RecommendationType) => {
    switch (type) {
      case RecommendationType.TRACK: return <Music className="h-4 w-4" />;
      case RecommendationType.ARTIST: return <Users className="h-4 w-4" />;
      case RecommendationType.COMPETITION: return <TrendingUp className="h-4 w-4" />;
      case RecommendationType.MOOD: return <Zap className="h-4 w-4" />;
      case RecommendationType.GENRE: return <Compass className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'COLLABORATIVE_FILTERING': return 'bg-blue-500/20 text-blue-500';
      case 'CONTENT_BASED': return 'bg-green-500/20 text-green-500';
      case 'TRENDING': return 'bg-purple-500/20 text-purple-500';
      case 'MOOD_MATCHING': return 'bg-orange-500/20 text-orange-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (error) {
    return (
      <Card variant="glass" className={className}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Recommendations Unavailable</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Discover New Music
          </h2>
          <p className="text-gray-400">
            AI-powered recommendations tailored just for you
          </p>
        </div>

        {discoverySession && (
          <Badge variant="outline" className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Discovery Score: {discoverySession.discoveryScore.toFixed(1)}
          </Badge>
        )}
      </div>

      {/* Recommendation Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => useRecommendationStore.setState({ activeTab: value })}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 p-1 bg-dark-800/50 rounded-2xl backdrop-blur-xl">
          <TabTrigger value="for-you" icon={<Users className="h-4 w-4" />}>
            For You
          </TabTrigger>
          <TabTrigger value="discovery" icon={<Compass className="h-4 w-4" />}>
            Discovery
          </TabTrigger>
          <TabTrigger value="trending" icon={<TrendingUp className="h-4 w-4" />}>
            Trending
          </TabTrigger>
          <TabTrigger value="mood" icon={<Zap className="h-4 w-4" />}>
            Mood
          </TabTrigger>
          <TabTrigger value="genre" icon={<Music className="h-4 w-4" />}>
            Genre
          </TabTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Recommendations Grid */}
          <div className="space-y-4">
            <AnimatePresence>
              {visibleRecommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RecommendationCard
                    recommendation={recommendation}
                    onFeedback={handleFeedback}
                    position={index}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <Loader className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            )}

            {/* Load More Trigger */}
            {!isLoading && visibleRecommendations.length < filteredRecommendations.length && (
              <div ref={loadMoreRef} className="h-10" />
            )}

            {/* Empty State */}
            {!isLoading && visibleRecommendations.length === 0 && (
              <Card variant="glass" className="text-center py-12">
                <CardContent>
                  <Compass className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Recommendations</h3>
                  <p className="text-gray-400">
                    {activeTab === 'for-you' 
                      ? "Complete your profile to get personalized recommendations"
                      : "Try exploring different tabs to discover new music"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ 
  recommendation, 
  onFeedback,
  position 
}: { 
  recommendation: Recommendation;
  onFeedback: (id: string, type: string) => void;
  position: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card 
      variant="glass" 
      className="backdrop-blur-xl hover:bg-dark-700/50 transition-all cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Album Art / Avatar */}
          <div className="flex-shrink-0 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              {getRecommendationIcon(recommendation.type)}
            </div>
            
            {/* Relevance Badge */}
            <div className="absolute -top-2 -right-2">
              <Badge variant="primary" className="text-xs">
                {(recommendation.relevanceScore * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {recommendation.track.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  by {recommendation.artist.stageName}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Badge variant="outline" className={cn("text-xs", getSourceColor(recommendation.source))}>
                  {recommendation.source.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                </Badge>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-sm text-gray-300 mb-3 line-clamp-2">
              {recommendation.explanation}
            </p>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{(recommendation.predictedEngagement * 100).toFixed(0)}% engagement</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{(recommendation.predictedCompletion * 100).toFixed(0)}% completion</span>
              </div>
              {recommendation.novelty > 0.7 && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Compass className="h-3 w-3" />
                  <span>New discovery</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(recommendation.id, 'PLAY');
                }}
                className="flex items-center gap-1"
              >
                <Music className="h-4 w-4" />
                Play
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(recommendation.id, 'LIKE');
                }}
                className="flex items-center gap-1"
              >
                <Heart className="h-4 w-4" />
                Like
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(recommendation.id, 'SKIP');
                }}
                className="flex items-center gap-1"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(recommendation.id, 'SHARE');
                }}
                className="flex items-center gap-1"
              >
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Audio Preview */}
                    <div>
                      <h4 className="font-semibold text-white mb-2">Preview</h4>
                      <AudioPlayerMini track={recommendation.track} />
                    </div>

                    {/* AI Insights */}
                    <div>
                      <h4 className="font-semibold text-white mb-2">Why this recommendation?</h4>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex justify-between">
                          <span>Relevance:</span>
                          <span>{(recommendation.relevanceScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Novelty:</span>
                          <span>{(recommendation.novelty * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span>{(recommendation.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Supporting Components
function TabTrigger({ value, icon, children }: { 
  value: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  const { activeTab } = useRecommendationStore();
  
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

// Helper function to get recommendation icon
function getRecommendationIcon(type: RecommendationType) {
  switch (type) {
    case RecommendationType.TRACK: return <Music className="h-6 w-6" />;
    case RecommendationType.ARTIST: return <Users className="h-6 w-6" />;
    case RecommendationType.COMPETITION: return <TrendingUp className="h-6 w-6" />;
    case RecommendationType.MOOD: return <Zap className="h-6 w-6" />;
    case RecommendationType.GENRE: return <Compass className="h-6 w-6" />;
    default: return <Star className="h-6 w-6" />;
  }
}
