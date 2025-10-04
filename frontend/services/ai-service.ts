// frontend/services/ai-service.ts
import { 
  AITalentAnalysis, 
  AnalysisRequest, 
  AnalysisResponse, 
  RealTimeAnalysisConfig,
  AIPerformanceBenchmark 
} from '@/types/ai';

class AIService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, AITalentAnalysis> = new Map();
  private realTimeSessions: Map<string, WebSocket> = new Map();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://ai.bak55.com';
    this.apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
  }

  /**
   * Analyze track with comprehensive AI talent scoring
   */
  async analyzeTrack(request: AnalysisRequest): Promise<AITalentAnalysis> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && new Date(cached.expiresAt) > new Date()) {
        console.log('Serving from cache:', cacheKey);
        return cached;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result: AnalysisResponse = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, result.analysis);
      
      // Track analytics
      this.trackAnalysis(result);
      
      return result.analysis;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`Failed to analyze track: ${error.message}`);
    }
  }

  /**
   * Start real-time analysis during track playback
   */
  async startRealTimeAnalysis(
    trackId: string, 
    config: RealTimeAnalysisConfig
  ): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.baseUrl.replace('https', 'wss')}/api/ai/realtime`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'START_ANALYSIS',
          trackId,
          config
        }));
        this.realTimeSessions.set(trackId, ws);
        resolve(ws);
      };
      
      ws.onerror = (error) => {
        reject(new Error(`WebSocket connection failed: ${error}`));
      };
      
      ws.onclose = () => {
        this.realTimeSessions.delete(trackId);
      };
    });
  }

  /**
   * Stop real-time analysis
   */
  stopRealTimeAnalysis(trackId: string): void {
    const ws = this.realTimeSessions.get(trackId);
    if (ws) {
      ws.close();
      this.realTimeSessions.delete(trackId);
    }
  }

  /**
   * Get performance benchmarks for artist
   */
  async getPerformanceBenchmarks(artistId: string): Promise<AIPerformanceBenchmark[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/benchmarks/${artistId}`);
      if (!response.ok) throw new Error('Failed to fetch benchmarks');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      throw error;
    }
  }

  /**
   * Generate personalized career recommendations
   */
  async generateCareerRecommendations(artistId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/recommendations/career`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ artistId }),
      });

      if (!response.ok) throw new Error('Failed to generate recommendations');
      
      return await response.json();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Compare artist against competitors
   */
  async competitiveAnalysis(artistId: string, competitorIds: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/competitive-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ artistId, competitorIds }),
      });

      if (!response.ok) throw new Error('Failed to perform competitive analysis');
      
      return await response.json();
    } catch (error) {
      console.error('Error in competitive analysis:', error);
      throw error;
    }
  }

  /**
   * Get trend analysis for artist's genre
   */
  async getGenreTrends(genre: string, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ai/trends?genre=${genre}&timeframe=${timeframe}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch genre trends');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching genre trends:', error);
      throw error;
    }
  }

  /**
   * Predict track success probability
   */
  async predictSuccess(trackId: string): Promise<{ probability: number; factors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/predict-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ trackId }),
      });

      if (!response.ok) throw new Error('Failed to predict success');
      
      return await response.json();
    } catch (error) {
      console.error('Error predicting success:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple tracks
   */
  async batchAnalyzeTracks(requests: AnalysisRequest[]): Promise<AITalentAnalysis[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/analyze/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ requests }),
      });

      if (!response.ok) throw new Error('Batch analysis failed');
      
      const results = await response.json();
      return results.analyses;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.8 // This would be calculated from actual usage
    };
  }

  // Private methods
  private generateCacheKey(request: AnalysisRequest): string {
    return `${request.trackId}_${request.metadata.duration}_${request.artistInfo.genre}`;
  }

  private trackAnalysis(response: AnalysisResponse): void {
    // Track AI analysis for monitoring and billing
    const analyticsData = {
      processingTime: response.processingTime,
      cost: response.cost,
      modelVersion: response.modelVersion,
      timestamp: new Date().toISOString()
    };

    // Send to analytics service
    fetch('/api/analytics/ai-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyticsData),
    }).catch(console.error);
  }
}

export const aiService = new AIService();
