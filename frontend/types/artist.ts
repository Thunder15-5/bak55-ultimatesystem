// frontend/types/artist.ts
export interface ArtistProfile {
  id: string;
  userId: string;
  user: User;
  
  // Core Metrics
  talentScore: number;
  monthlyListeners: number;
  totalEarnings: number;
  engagementRate: number;
  
  // AI Analysis Scores (0-10)
  vocalQuality?: number;
  musicality?: number;
  originality?: number;
  marketPotential?: number;
  productionQuality?: number;
  
  // Career Progression
  careerStage: 'EMERGING' | 'GROWING' | 'ESTABLISHED' | 'STAR';
  milestones: Milestone[];
  skillGaps: SkillGap[];
  
  // Performance Metrics
  performanceMetrics: {
    avgPlayCompletion: number;
    listenerRetention: number;
    shareRate: number;
    tipConversion: number;
  };
  
  // Timestamps
  joinedAt: Date;
  lastActive: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  artistId: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
  value?: number; // For quantitative milestones
  badge?: string; // Badge image/icon
}

export interface SkillGap {
  id: string;
  artistId: string;
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  resources: LearningResource[];
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'COURSE' | 'ARTICLE' | 'VIDEO' | 'TOOL';
  url: string;
  duration?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  provider: string;
}

export interface RevenueStream {
  type: RevenueType;
  amount: number;
  percentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  change: number; // Percentage change
}

export interface AudienceDemographics {
  ageGroups: {
    group: string;
    percentage: number;
  }[];
  genders: {
    gender: string;
    percentage: number;
  }[];
  locations: {
    country: string;
    city?: string;
    listeners: number;
    percentage: number;
  }[];
  devices: {
    device: string;
    percentage: number;
  }[];
}

export interface PerformanceAnalytics {
  period: '7d' | '30d' | '90d' | '1y';
  plays: TimeSeriesData[];
  likes: TimeSeriesData[];
  shares: TimeSeriesData[];
  tips: TimeSeriesData[];
  revenue: TimeSeriesData[];
  listeners: TimeSeriesData[];
  engagement: TimeSeriesData[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  change?: number;
}

export interface CompetitionPerformance {
  competition: Competition;
  entry: CompetitionEntry;
  rank?: number;
  prize?: number;
  votes: number;
  performance: {
    score: number;
    percentile: number;
    improvement: number;
  };
}

export interface CareerInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionItems: string[];
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: 'SHORT_TERM' | 'MID_TERM' | 'LONG_TERM';
  generatedAt: Date;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  eligibility: {
    minTalentScore?: number;
    minMonthlyListeners?: number;
    requiredGenres?: string[];
    location?: string[];
  };
  reward: {
    type: 'MONEY' | 'EXPOSURE' | 'COLLABORATION' | 'EQUIPMENT';
    value: number;
    description: string;
  };
  deadline?: Date;
  applicationUrl?: string;
  matchScore: number; // 0-100 how well it matches the artist
}

// Enums
export enum MilestoneType {
  FIRST_TRACK = 'FIRST_TRACK',
  FIRST_1000_PLAYS = 'FIRST_1000_PLAYS',
  FIRST_TIP = 'FIRST_TIP',
  COMPETITION_WIN = 'COMPETITION_WIN',
  TALENT_SCORE_8 = 'TALENT_SCORE_8',
  MONTHLY_1000_LISTENERS = 'MONTHLY_1000_LISTENERS',
  EARNED_10000_COINS = 'EARNED_10000_COINS',
  BRAND_PARTNERSHIP = 'BRAND_PARTNERSHIP'
}

export enum RevenueType {
  STREAMING = 'STREAMING',
  COMPETITIONS = 'COMPETITIONS',
  TIPS = 'TIPS',
  ROYALTIES = 'ROYALTIES',
  BRAND_DEALS = 'BRAND_DEALS',
  MERCHANDISE = 'MERCHANDISE',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS'
}

export enum InsightType {
  PERFORMANCE = 'PERFORMANCE',
  AUDIENCE = 'AUDIENCE',
  REVENUE = 'REVENUE',
  SKILL = 'SKILL',
  OPPORTUNITY = 'OPPORTUNITY',
  COMPETITION = 'COMPETITION'
}

export enum OpportunityType {
  BRAND_DEAL = 'BRAND_DEAL',
  COLLABORATION = 'COLLABORATION',
  LIVE_PERFORMANCE = 'LIVE_PERFORMANCE',
  COMPETITION = 'COMPETITION',
  PLAY_LISTING = 'PLAY_LISTING',
  INTERVIEW = 'INTERVIEW'
}
