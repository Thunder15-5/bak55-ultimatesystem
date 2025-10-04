// frontend/store/ai-analysis-store.ts
import { create } from 'zustand';
import { 
  AITalentAnalysis, 
  AnalysisRequest, 
  RealTimeAnalysisConfig,
  AIPerformanceBenchmark 
} from '@/types/ai';
import { aiService } from '@/services/ai-service';

interface AIAnalysisState {
  // State
  currentAnalysis: AITalentAnalysis | null;
  historicalAnalyses: AITalentAnalysis[];
  benchmarks: AIPerformanceBenchmark[];
  realTimeConfig: RealTimeAnalysisConfig | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  fetchAnalysis: (trackId: string, artistId: string) => Promise<void>;
  startRealTimeAnalysis: (trackId: string, config: RealTimeAnalysisConfig) => Promise<void>;
  stopRealTimeAnalysis: (trackId: string) => void;
  fetchBenchmarks: (artistId: string) => Promise<void>;
  clearAnalysis: () => void;
  refreshAnalysis: (trackId: string, artistId: string) => Promise<void>;
  
  // Batch Operations
  batchAnalyzeTracks: (requests: AnalysisRequest[]) => Promise<AITalentAnalysis[]>;
  compareAnalyses: (analysisIds: string[]) => ComparisonResult[];
  
  // Analytics
  getAnalysisTrends: (artistId: string) => AnalysisTrend[];
  getImprovementAreas: (artistId: string) => ImprovementArea[];
}

interface ComparisonResult {
  aspect: string;
  current: number;
  previous: number;
  change: number;
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AnalysisTrend {
  date: Date;
  overallScore: number;
  vocalQuality: number;
  musicality: number;
  originality: number;
  productionQuality: number;
  marketPotential: number;
}

export const useAIAnalysisStore = create<AIAnalysisState>((set, get) => ({
  // Initial State
  currentAnalysis: null,
  historicalAnalyses: [],
  benchmarks: [],
  realTimeConfig: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Fetch AI Analysis
  fetchAnalysis: async (trackId: string, artistId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const request: AnalysisRequest = {
        trackId,
        audioUrl: `/api/tracks/${trackId}/stream`, // This would be the actual audio URL
        metadata: {
          duration: 180, // This would come from track metadata
          format: 'mp3',
          sampleRate: 44100,
          bitrate: 320
        },
        artistInfo: {
          genre: 'Afrobeats', // This would come from artist profile
          experience: 'INTERMEDIATE', // This would come from artist profile
          location: 'Lagos, Nigeria' // This would come from artist profile
        },
        config: {
          detailed: true,
          realtime: false,
          benchmarks: true
        }
      };

      const analysis = await aiService.analyzeTrack(request);
      
      set({ 
        currentAnalysis: analysis,
        historicalAnalyses: [analysis, ...get().historicalAnalyses.slice(0, 9)], // Keep last 10
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  // Start Real-time Analysis
  startRealTimeAnalysis: async (trackId: string, config: RealTimeAnalysisConfig) => {
    try {
      await aiService.startRealTimeAnalysis(trackId, config);
      set({ realTimeConfig: config });
    } catch (error) {
      console.error('Error starting real-time analysis:', error);
      set({ error: error.message });
    }
  },

  // Stop Real-time Analysis
  stopRealTimeAnalysis: (trackId: string) => {
    aiService.stopRealTimeAnalysis(trackId);
    set({ realTimeConfig: null });
  },

  // Fetch Performance Benchmarks
  fetchBenchmarks: async (artistId: string) => {
    try {
      const benchmarks = await aiService.getPerformanceBenchmarks(artistId);
      set({ benchmarks });
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      set({ error: error.message });
    }
  },

  // Clear Current Analysis
  clearAnalysis: () => {
    set({ 
      currentAnalysis: null,
      error: null 
    });
  },

  // Refresh Analysis
  refreshAnalysis: async (trackId: string, artistId: string) => {
    // Clear cache for this track
    aiService.clearCache();
    return get().fetchAnalysis(trackId, artistId);
  },

  // Batch Analyze Tracks
  batchAnalyzeTracks: async (requests: AnalysisRequest[]): Promise<AITalentAnalysis[]> => {
    set({ isLoading: true, error: null });
    
    try {
      const analyses = await aiService.batchAnalyzeTracks(requests);
      set({ isLoading: false });
      return analyses;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  // Compare Multiple Analyses
  compareAnalyses: (analysisIds: string[]): ComparisonResult[] => {
    const { historicalAnalyses } = get();
    const analyses = historicalAnalyses.filter(a => analysisIds.includes(a.id));
    
    if (analyses.length < 2) return [];

    const current = analyses[0];
    const previous = analyses[1];

    const aspects = ['overallScore', 'vocalQuality', 'musicality', 'originality', 'productionQuality', 'marketPotential'];
    
    return aspects.map(aspect => {
      const currentValue = current.scoreBreakdown[aspect]?.score || current.overallScore;
      const previousValue = previous.scoreBreakdown[aspect]?.score || previous.overallScore;
      const change = currentValue - previousValue;
      
      let significance: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (Math.abs(change) >= 1.5) significance = 'HIGH';
      else if (Math.abs(change) >= 0.5) significance = 'MEDIUM';

      return {
        aspect: aspect.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        current: currentValue,
        previous: previousValue,
        change,
        significance
      };
    });
  },

  // Get Analysis Trends
  getAnalysisTrends: (artistId: string): AnalysisTrend[] => {
    const { historicalAnalyses } = get();
    const artistAnalyses = historicalAnalyses.filter(a => a.artistId === artistId);
    
    return artistAnalyses.slice(0, 6).map(analysis => ({
      date: analysis.processedAt,
      overallScore: analysis.overallScore,
      vocalQuality: analysis.scoreBreakdown.vocalQuality.score,
      musicality: analysis.scoreBreakdown.musicality.score,
      originality: analysis.scoreBreakdown.originality.score,
      productionQuality: analysis.scoreBreakdown.productionQuality.score,
      marketPotential: analysis.scoreBreakdown.marketPotential.score
    })).reverse(); // Oldest first
  },

  // Get Improvement Areas
  getImprovementAreas: (artistId: string): ImprovementArea[] => {
    const { historicalAnalyses } = get();
    const artistAnalyses = historicalAnalyses.filter(a => a.artistId === artistId);
    
    if (artistAnalyses.length === 0) return [];

    const currentAnalysis = artistAnalyses[0];
    return currentAnalysis.improvements
      .filter(imp => imp.priority === 'HIGH' || imp.priority === 'CRITICAL')
      .slice(0, 5);
  }
}));
