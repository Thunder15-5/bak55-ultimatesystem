// frontend/store/artist-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ArtistProfile, 
  PerformanceAnalytics, 
  RevenueStream, 
  AudienceDemographics, 
  CompetitionPerformance,
  CareerInsight,
  Opportunity
} from '@/types/artist';

interface ArtistState {
  // Core State
  profile: ArtistProfile | null;
  analytics: PerformanceAnalytics | null;
  revenueStreams: RevenueStream[];
  audience: AudienceDemographics | null;
  competitionHistory: CompetitionPerformance[];
  careerInsights: CareerInsight[];
  opportunities: Opportunity[];
  
  // UI State
  isLoading: boolean;
  activeTab: 'overview' | 'music' | 'competitions' | 'earnings' | 'audience' | 'career';
  timeRange: '7d' | '30d' | '90d' | '1y';
  
  // Actions
  fetchArtistProfile: () => Promise<void>;
  fetchAnalytics: (timeRange?: string) => Promise<void>;
  fetchRevenueStreams: () => Promise<void>;
  fetchAudienceDemographics: () => Promise<void>;
  fetchCompetitionHistory: () => Promise<void>;
  fetchCareerInsights: () => Promise<void>;
  fetchOpportunities: () => Promise<void>;
  
  // Advanced Analytics
  getGrowthMetrics: () => GrowthMetrics;
  getEngagementMetrics: () => EngagementMetrics;
  getRevenueProjections: () => RevenueProjection[];
  getSkillDevelopmentPlan: () => SkillDevelopmentPlan;
  
  // Career Management
  updateCareerGoals: (goals: string[]) => Promise<void>;
  trackPractice: (skill: string, duration: number, notes?: string) => Promise<void>;
  applyForOpportunity: (opportunityId: string) => Promise<void>;
  
  // AI Recommendations
  generateCareerPath: () => Promise<CareerPath>;
  getPersonalizedRecommendations: () => Promise<Recommendation[]>;
}

interface GrowthMetrics {
  listenerGrowth: number;
  revenueGrowth: number;
  engagementGrowth: number;
  talentScoreGrowth: number;
}

interface EngagementMetrics {
  avgPlayDuration: number;
  completionRate: number;
  shareRate: number;
  tipRate: number;
  repeatListenerRate: number;
}

interface RevenueProjection {
  period: string;
  projectedRevenue: number;
  confidence: number;
  factors: string[];
}

interface SkillDevelopmentPlan {
  currentSkills: { skill: string; level: number }[];
  targetSkills: { skill: string; targetLevel: number; priority: string }[];
  recommendedResources: any[];
  estimatedTimeline: string;
}

interface CareerPath {
  currentStage: string;
  nextStage: string;
  requirements: string[];
  timeline: string;
  potentialEarnings: number;
}

interface Recommendation {
  type: 'TRACK' | 'COMPETITION' | 'SKILL' | 'OPPORTUNITY' | 'CONTENT';
  title: string;
  description: string;
  reason: string;
  priority: number;
  action: string;
  actionUrl?: string;
}

export const useArtistStore = create<ArtistState>((set, get) => ({
  // Initial State
  profile: null,
  analytics: null,
  revenueStreams: [],
  audience: null,
  competitionHistory: [],
  careerInsights: [],
  opportunities: [],
  isLoading: false,
  activeTab: 'overview',
  timeRange: '30d',

  // Fetch Artist Profile
  fetchArtistProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/artist/profile');
      if (!response.ok) throw new Error('Failed to fetch artist profile');
      
      const profile = await response.json();
      set({ profile, isLoading: false });
    } catch (error) {
      console.error('Error fetching artist profile:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch Analytics
  fetchAnalytics: async (timeRange = '30d') => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/artist/analytics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analytics = await response.json();
      set({ analytics, timeRange, isLoading: false });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch Revenue Streams
  fetchRevenueStreams: async () => {
    try {
      const response = await fetch('/api/artist/revenue');
      if (!response.ok) throw new Error('Failed to fetch revenue streams');
      
      const revenueStreams = await response.json();
      set({ revenueStreams });
    } catch (error) {
      console.error('Error fetching revenue streams:', error);
      throw error;
    }
  },

  // Fetch Audience Demographics
  fetchAudienceDemographics: async () => {
    try {
      const response = await fetch('/api/artist/audience');
      if (!response.ok) throw new Error('Failed to fetch audience demographics');
      
      const audience = await response.json();
      set({ audience });
    } catch (error) {
      console.error('Error fetching audience demographics:', error);
      throw error;
    }
  },

  // Fetch Competition History
  fetchCompetitionHistory: async () => {
    try {
      const response = await fetch('/api/artist/competitions');
      if (!response.ok) throw new Error('Failed to fetch competition history');
      
      const competitionHistory = await response.json();
      set({ competitionHistory });
    } catch (error) {
      console.error('Error fetching competition history:', error);
      throw error;
    }
  },

  // Fetch Career Insights
  fetchCareerInsights: async () => {
    try {
      const response = await fetch('/api/artist/insights');
      if (!response.ok) throw new Error('Failed to fetch career insights');
      
      const careerInsights = await response.json();
      set({ careerInsights });
    } catch (error) {
      console.error('Error fetching career insights:', error);
      throw error;
    }
  },

  // Fetch Opportunities
  fetchOpportunities: async () => {
    try {
      const response = await fetch('/api/artist/opportunities');
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      
      const opportunities = await response.json();
      set({ opportunities });
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  },

  // Advanced Analytics Calculations
  getGrowthMetrics: (): GrowthMetrics => {
    const { analytics, profile } = get();
    
    if (!analytics || !profile) {
      return {
        listenerGrowth: 0,
        revenueGrowth: 0,
        engagementGrowth: 0,
        talentScoreGrowth: 0
      };
    }

    // Calculate growth percentages (simplified)
    const listenerGrowth = analytics.listeners.length > 1 
      ? ((analytics.listeners[analytics.listeners.length - 1].value - analytics.listeners[0].value) / analytics.listeners[0].value) * 100
      : 0;

    const revenueGrowth = analytics.revenue.length > 1
      ? ((analytics.revenue[analytics.revenue.length - 1].value - analytics.revenue[0].value) / analytics.revenue[0].value) * 100
      : 0;

    return {
      listenerGrowth,
      revenueGrowth,
      engagementGrowth: 0, // Would need historical engagement data
      talentScoreGrowth: 0 // Would need historical talent scores
    };
  },

  getEngagementMetrics: (): EngagementMetrics => {
    const { analytics, profile } = get();
    
    return {
      avgPlayDuration: profile?.performanceMetrics?.avgPlayCompletion || 0,
      completionRate: profile?.performanceMetrics?.avgPlayCompletion || 0,
      shareRate: profile?.performanceMetrics?.shareRate || 0,
      tipRate: profile?.performanceMetrics?.tipConversion || 0,
      repeatListenerRate: profile?.performanceMetrics?.listenerRetention || 0
    };
  },

  getRevenueProjections: (): RevenueProjection[] => {
    const { revenueStreams, analytics } = get();
    
    if (!analytics || revenueStreams.length === 0) return [];

    const currentRevenue = revenueStreams.reduce((sum, stream) => sum + stream.amount, 0);
    const growthRate = 0.15; // Assume 15% monthly growth

    return [
      {
        period: 'Next Month',
        projectedRevenue: currentRevenue * (1 + growthRate),
        confidence: 0.8,
        factors: ['Current growth trend', 'Seasonal patterns']
      },
      {
        period: 'Next 3 Months',
        projectedRevenue: currentRevenue * Math.pow(1 + growthRate, 3),
        confidence: 0.6,
        factors: ['Market conditions', 'Competition performance']
      },
      {
        period: 'Next 6 Months',
        projectedRevenue: currentRevenue * Math.pow(1 + growthRate, 6),
        confidence: 0.4,
        factors: ['Industry trends', 'Platform growth']
      }
    ];
  },

  getSkillDevelopmentPlan: (): SkillDevelopmentPlan => {
    const { profile } = get();
    
    if (!profile) {
      return {
        currentSkills: [],
        targetSkills: [],
        recommendedResources: [],
        estimatedTimeline: 'N/A'
      };
    }

    const currentSkills = [
      { skill: 'Vocal Quality', level: profile.vocalQuality || 0 },
      { skill: 'Musicality', level: profile.musicality || 0 },
      { skill: 'Originality', level: profile.originality || 0 },
      { skill: 'Production', level: profile.productionQuality || 0 }
    ];

    const targetSkills = currentSkills.map(skill => ({
      skill: skill.skill,
      targetLevel: Math.min(10, skill.level + 1),
      priority: skill.level < 7 ? 'HIGH' : skill.level < 9 ? 'MEDIUM' : 'LOW'
    }));

    return {
      currentSkills,
      targetSkills,
      recommendedResources: [],
      estimatedTimeline: '3-6 months'
    };
  },

  // Career Management
  updateCareerGoals: async (goals: string[]) => {
    try {
      const response = await fetch('/api/artist/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Update local state if needed
    } catch (error) {
      console.error('Error updating career goals:', error);
      throw error;
    }
  },

  trackPractice: async (skill: string, duration: number, notes?: string) => {
    try {
      const response = await fetch('/api/artist/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, duration, notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error tracking practice:', error);
      throw error;
    }
  },

  applyForOpportunity: async (opportunityId: string) => {
    try {
      const response = await fetch('/api/artist/opportunities/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Update local state
      set(state => ({
        opportunities: state.opportunities.filter(opp => opp.id !== opportunityId)
      }));
    } catch (error) {
      console.error('Error applying for opportunity:', error);
      throw error;
    }
  },

  // AI Recommendations
  generateCareerPath: async (): Promise<CareerPath> => {
    try {
      const response = await fetch('/api/artist/career-path');
      if (!response.ok) throw new Error('Failed to generate career path');
      
      return await response.json();
    } catch (error) {
      console.error('Error generating career path:', error);
      throw error;
    }
  },

  getPersonalizedRecommendations: async (): Promise<Recommendation[]> => {
    try {
      const response = await fetch('/api/artist/recommendations');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },
}));
