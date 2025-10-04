// frontend/services/recommendation-service.ts
import { 
  Recommendation, 
  RecommendationBatch, 
  RecommendationContext, 
  UserPreferences,
  CollaborativeFilteringResult,
  ContentBasedResult,
  HybridResult,
  RealTimeRecommendationConfig,
  RecommendationMetrics,
  DiscoverySession,
  FeedbackEvent
} from '@/types/recommendation';

class RecommendationService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, RecommendationBatch> = new Map();
  private realTimeSessions: Map<string, WebSocket> = new Map();
  private feedbackQueue: FeedbackEvent[] = [];
  private isProcessingFeedback = false;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_RECOMMENDATION_SERVICE_URL || 'https://recs.bak55.com';
    this.apiKey = process.env.NEXT_PUBLIC_RECOMMENDATION_API_KEY || '';
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(
    userId: string, 
    context: RecommendationContext,
    count: number = 20,
    types: string[] = ['TRACK', 'ARTIST', 'COMPETITION']
  ): Promise<RecommendationBatch> {
    const cacheKey = this.generateCacheKey(userId, context);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        console.log('Serving recommendations from cache:', cacheKey);
        return cached;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userId,
          context,
          count,
          types,
          algorithm: 'HYBRID' // Use hybrid approach by default
        }),
      });

      if (!response.ok) {
        throw new Error(`Recommendation failed: ${response.statusText}`);
      }

      const batch: RecommendationBatch = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, batch);
      
      // Track recommendation generation
      this.trackRecommendationGeneration(batch);
      
      return batch;
    } catch (error) {
      console.error('Recommendation Error:', error);
      
      // Fallback to trending recommendations
      return this.getTrendingFallback(userId, context, count);
    }
  }

  /**
   * Start real-time recommendation updates
   */
  async startRealTimeRecommendations(
    userId: string,
    config: RealTimeRecommendationConfig
  ): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.baseUrl.replace('https', 'wss')}/api/recommendations/realtime`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'START_RECOMMENDATIONS',
          userId,
          config
        }));
        this.realTimeSessions.set(userId, ws);
        resolve(ws);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'RECOMMENDATION_UPDATE') {
          this.handleRealTimeUpdate(data.recommendations);
        }
      };
      
      ws.onerror = (error) => {
        reject(new Error(`WebSocket connection failed: ${error}`));
      };
      
      ws.onclose = () => {
        this.realTimeSessions.delete(userId);
      };
    });
  }

  /**
   * Stop real-time recommendations
   */
  stopRealTimeRecommendations(userId: string): void {
    const ws = this.realTimeSessions.get(userId);
    if (ws) {
      ws.close();
      this.realTimeSessions.delete(userId);
    }
  }

  /**
   * Get similar artists based on multiple factors
   */
  async getSimilarArtists(
    artistId: string, 
    count: number = 10,
    method: 'CONTENT_BASED' | 'COLLABORATIVE' | 'HYBRID' = 'HYBRID'
  ): Promise<Recommendation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/similar/artists/${artistId}?count=${count}&method=${method}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch similar artists');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching similar artists:', error);
      throw error;
    }
  }

  /**
   * Get track recommendations based on seed tracks
   */
  async getTrackRecommendations(
    seedTracks: string[], 
    context: RecommendationContext,
    count: number = 20
  ): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recommendations/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          seedTracks,
          context,
          count
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch track recommendations');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching track recommendations:', error);
      throw error;
    }
  }

  /**
   * Get mood-based recommendations
   */
  async getMoodRecommendations(
    mood: string,
    intensity: number,
    context: RecommendationContext,
    count: number = 15
  ): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recommendations/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          mood,
          intensity,
          context,
          count
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch mood recommendations');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching mood recommendations:', error);
      throw error;
    }
  }

  /**
   * Get genre exploration recommendations
   */
  async getGenreExploration(
    baseGenre: string,
    explorationLevel: number, // 0-1, where 1 is maximum exploration
    context: RecommendationContext,
    count: number = 12
  ): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/recommendations/genre-exploration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          baseGenre,
          explorationLevel,
          context,
          count
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch genre exploration');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching genre exploration:', error);
      throw error;
    }
  }

  /**
   * Record user feedback for recommendations
   */
  async recordFeedback(feedback: FeedbackEvent): Promise<void> {
    // Add to queue for batch processing
    this.feedbackQueue.push(feedback);
    
    // Process queue if not already processing
    if (!this.isProcessingFeedback) {
      this.processFeedbackQueue();
    }
  }

  /**
   * Start a discovery session
   */
  async startDiscoverySession(
    userId: string, 
    context: RecommendationContext
  ): Promise<DiscoverySession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/discovery/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userId,
          context
        }),
      });

      if (!response.ok) throw new Error('Failed to start discovery session');
      
      return await response.json();
    } catch (error) {
      console.error('Error starting discovery session:', error);
      throw error;
    }
  }

  /**
   * End a discovery session and get insights
   */
  async endDiscoverySession(sessionId: string): Promise<DiscoverySession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/discovery/end/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) throw new Error('Failed to end discovery session');
      
      return await response.json();
    } catch (error) {
      console.error('Error ending discovery session:', error);
      throw error;
    }
  }

  /**
   * Get recommendation system metrics
   */
  async getMetrics(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<RecommendationMetrics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/metrics?timeframe=${timeframe}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  /**
   * Clear recommendation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; averageAge: number } {
    return {
      size: this.cache.size,
      hitRate: 0.75, // This would be calculated from actual usage
      averageAge: this.calculateAverageCacheAge()
    };
  }

  // Private methods
  private generateCacheKey(userId: string, context: RecommendationContext): string {
    const contextKey = `${context.timeOfDay}_${context.activity}_${context.device}`;
    return `${userId}_${contextKey}_${Date.now()}`;
  }

  private isCacheValid(batch: RecommendationBatch): boolean {
    const age = Date.now() - new Date(batch.generatedAt).getTime();
    return age < 5 * 60 * 1000; // 5 minutes cache validity
  }

  private async getTrendingFallback(
    userId: string, 
    context: RecommendationContext, 
    count: number
  ): Promise<RecommendationBatch> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/recommendations/trending?count=${count}`
      );
      
      if (!response.ok) throw new Error('Trending fallback failed');
      
      const trending = await response.json();
      
      return {
        id: `fallback-${Date.now()}`,
        userId,
        recommendations: trending,
        context,
        generatedAt: new Date(),
        algorithm: 'TRENDING_FALLBACK',
        processingTime: 0
      };
    } catch (error) {
      console.error('Trending fallback also failed:', error);
      
      // Ultimate fallback - return empty recommendations
      return {
        id: `empty-${Date.now()}`,
        userId,
        recommendations: [],
        context,
        generatedAt: new Date(),
        algorithm: 'EMPTY_FALLBACK',
        processingTime: 0
      };
    }
  }

  private handleRealTimeUpdate(recommendations: Recommendation[]): void {
    // Dispatch event for components to listen to
    const event = new CustomEvent('recommendationUpdate', {
      detail: { recommendations }
    });
    window.dispatchEvent(event);
  }

  private async processFeedbackQueue(): Promise<void> {
    if (this.feedbackQueue.length === 0) {
      this.isProcessingFeedback = false;
      return;
    }

    this.isProcessingFeedback = true;
    
    try {
      // Process in batches of 10
      const batch = this.feedbackQueue.splice(0, 10);
      
      await fetch(`${this.baseUrl}/api/feedback/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ feedback: batch }),
      });
      
      console.log(`Processed ${batch.length} feedback events`);
    } catch (error) {
      console.error('Error processing feedback:', error);
      // Re-add failed batch to queue
      this.feedbackQueue.unshift(...batch);
    }
    
    // Continue processing if there are more items
    setTimeout(() => this.processFeedbackQueue(), 1000);
  }

  private trackRecommendationGeneration(batch: RecommendationBatch): void {
    const analyticsData = {
      userId: batch.userId,
      recommendationCount: batch.recommendations.length,
      algorithm: batch.algorithm,
      processingTime: batch.processingTime,
      timestamp: new Date().toISOString()
    };

    // Send to analytics service
    fetch('/api/analytics/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyticsData),
    }).catch(console.error);
  }

  private calculateAverageCacheAge(): number {
    if (this.cache.size === 0) return 0;
    
    let totalAge = 0;
    const now = Date.now();
    
    this.cache.forEach(batch => {
      const age = now - new Date(batch.generatedAt).getTime();
      totalAge += age;
    });
    
    return totalAge / this.cache.size;
  }
}

export const recommendationService = new RecommendationService();
