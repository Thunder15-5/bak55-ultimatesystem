// frontend/store/recommendation-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Recommendation, 
  RecommendationBatch, 
  RecommendationContext, 
  UserPreferences,
  DiscoverySession,
  FeedbackEvent,
  RealTimeRecommendationConfig,
  RecommendationMetrics
} from '@/types/recommendation';
import { recommendationService } from '@/services/recommendation-service';

interface RecommendationState {
  // State
  currentRecommendations: Recommendation[];
  discoverySession: DiscoverySession | null;
  userPreferences: UserPreferences | null;
  metrics: RecommendationMetrics | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  activeTab: 'for-you' | 'discovery' | 'trending' | 'mood' | 'genre';
  
  // Real-time State
  realTimeConfig: RealTimeRecommendationConfig | null;
  isRealTimeActive: boolean;
  
  // Actions
  fetchRecommendations: (context: RecommendationContext, count?: number) => Promise<void>;
  startDiscoverySession: (context: RecommendationContext) => Promise<void>;
  endDiscoverySession: () => Promise<void>;
  recordFeedback: (feedback: Omit<FeedbackEvent, 'timestamp' | 'context'>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Real-time Actions
  startRealTimeRecommendations: (config: RealTimeRecommendationConfig) => Promise<void>;
  stopRealTimeRecommendations: () => void;
  
  // Analytics Actions
  fetchMetrics: (timeframe?: string) => Promise<void>;
  clearRecommendations: () => void;
  refreshRecommendations: (context: RecommendationContext) => Promise<void>;
  
  // Context Management
  updateContext: (updates: Partial<RecommendationContext>) => void;
  getCurrentContext: () => RecommendationContext;
}

const defaultContext: RecommendationContext = {
  timeOfDay: getTimeOfDay(),
  dayOfWeek: new Date().getDay(),
  device: 'DESKTOP',
  connection: 'WIFI',
  activity: 'LISTENING',
  socialContext: 'ALONE',
  currentMood: 'NEUTRAL',
  recentPlays: [],
  queue: [],
  lastSkipped: [],
  newReleases: true,
  trending: true,
  personalized: true
};

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  // Initial State
  currentRecommendations: [],
  discoverySession: null,
  userPreferences: null,
  metrics: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  activeTab: 'for-you',
  realTimeConfig: null,
  isRealTimeActive: false,

  // Fetch Recommendations
  fetchRecommendations: async (context: RecommendationContext, count: number = 20) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get user ID from auth store (this would come from your auth system)
      const userId = 'current-user-id'; // This would be dynamically set
      
      const batch = await recommendationService.getRecommendations(
        userId, 
        context, 
        count
      );
      
      set({ 
        currentRecommendations: batch.recommendations,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  // Start Discovery Session
  startDiscoverySession: async (context: RecommendationContext) => {
    set({ isLoading: true, error: null });
    
    try {
      const userId = 'current-user-id';
      const session = await recommendationService.startDiscoverySession(userId, context);
      
      set({ 
        discoverySession: session,
        isLoading: false
      });
    } catch (error) {
      console.error('Error starting discovery session:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  // End Discovery Session
  endDiscoverySession: async () => {
    const { discoverySession } = get();
    
    if (!discoverySession) return;
    
    try {
      const session = await recommendationService.endDiscoverySession(discoverySession.id);
      
      set({ 
        discoverySession: session
      });
    } catch (error) {
      console.error('Error ending discovery session:', error);
      set({ error: error.message });
    }
  },

  // Record Feedback
  recordFeedback: (feedback: Omit<FeedbackEvent, 'timestamp' | 'context'>) => {
    const { getCurrentContext } = get();
    
    const fullFeedback: FeedbackEvent = {
      ...feedback,
      timestamp: new Date(),
      context: getCurrentContext()
    };
    
    // Send to service (handles queuing and batching)
    recommendationService.recordFeedback(fullFeedback);
    
    // Update local state if needed (e.g., for immediate UI updates)
    if (feedback.type === 'SKIP' || feedback.type === 'DISLIKE') {
      set(state => ({
        currentRecommendations: state.currentRecommendations.filter(
          rec => rec.id !== feedback.recommendationId
        )
      }));
    }
  },

  // Update User Preferences
  updatePreferences: async (updates: Partial<UserPreferences>) => {
    set(state => ({
      userPreferences: state.userPreferences 
        ? { ...state.userPreferences, ...updates, updatedAt: new Date() }
        : null
    }));
    
    // Invalidate cache since preferences changed
    recommendationService.clearCache();
  },

  // Real-time Recommendations
  startRealTimeRecommendations: async (config: RealTimeRecommendationConfig) => {
    try {
      const userId = 'current-user-id';
      await recommendationService.startRealTimeRecommendations(userId, config);
      
      set({ 
        realTimeConfig: config,
        isRealTimeActive: true 
      });
      
      // Listen for real-time updates
      window.addEventListener('recommendationUpdate', (event: any) => {
        set({ 
          currentRecommendations: event.detail.recommendations,
          lastUpdated: new Date()
        });
      });
    } catch (error) {
      console.error('Error starting real-time recommendations:', error);
      set({ error: error.message });
    }
  },

  stopRealTimeRecommendations: () => {
    const userId = 'current-user-id';
    recommendationService.stopRealTimeRecommendations(userId);
    
    set({ 
      realTimeConfig: null,
      isRealTimeActive: false 
    });
  },

  // Analytics
  fetchMetrics: async (timeframe: string = '24h') => {
    try {
      const metrics = await recommendationService.getMetrics(timeframe as any);
      set({ metrics });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      set({ error: error.message });
    }
  },

  clearRecommendations: () => {
    set({ 
      currentRecommendations: [],
      lastUpdated: null 
    });
  },

  refreshRecommendations: async (context: RecommendationContext) => {
    // Clear cache and fetch fresh recommendations
    recommendationService.clearCache();
    return get().fetchRecommendations(context);
  },

  // Context Management
  updateContext: (updates: Partial<RecommendationContext>) => {
    const currentContext = get().getCurrentContext();
    const newContext = { ...currentContext, ...updates };
    
    // Update recommendations with new context
    get().fetchRecommendations(newContext);
  },

  getCurrentContext: (): RecommendationContext => {
    // This would combine stored context with real-time information
    return {
      ...defaultContext,
      timeOfDay: getTimeOfDay(),
      device: getDeviceType(),
      connection: getConnectionType()
    };
  }
}));

// Helper functions
function getTimeOfDay(): 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 22) return 'EVENING';
  return 'NIGHT';
}

function getDeviceType(): 'MOBILE' | 'DESKTOP' | 'TABLET' {
  const width = window.innerWidth;
  if (width < 768) return 'MOBILE';
  if (width < 1024) return 'TABLET';
  return 'DESKTOP';
}

function getConnectionType(): 'WIFI' | 'MOBILE' | 'OFFLINE' {
  // This is a simplified implementation
  // In a real app, you'd use the Network Information API
  return navigator.onLine ? 'WIFI' : 'OFFLINE';
}
