// frontend/types/recommendation.ts
export interface RecommendationEngine {
  id: string;
  name: string;
  type: 'COLLABORATIVE' | 'CONTENT_BASED' | 'HYBRID' | 'CONTEXTUAL';
  version: string;
  accuracy: number;
  latency: number;
  isActive: boolean;
  features: string[];
}

export interface UserPreferences {
  userId: string;
  
  // Explicit Preferences
  favoriteGenres: string[];
  favoriteArtists: string[];
  dislikedArtists: string[];
  bannedTracks: string[];
  
  // Implicit Preferences (AI-Derived)
  moodPatterns: MoodPattern[];
  listeningHabits: ListeningHabit[];
  engagementPatterns: EngagementPattern[];
  
  // Contextual Preferences
  timeBased: TimePreference[];
  locationBased: LocationPreference[];
  activityBased: ActivityPreference[];
  
  // Learning Signals
  feedbackHistory: FeedbackEvent[];
  explorationScore: number;
  diversityPreference: number;
  
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  source: RecommendationSource;
  track: AudioTrack;
  artist: Artist;
  
  // Relevance Scoring
  relevanceScore: number;
  confidence: number;
  novelty: number;
  diversity: number;
  explanation: string;
  
  // Engagement Predictions
  predictedEngagement: number;
  predictedSkipRate: number;
  predictedCompletion: number;
  
  // Business Logic
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiry?: Date;
  metadata: Record<string, any>;
  
  createdAt: Date;
}

export interface RecommendationBatch {
  id: string;
  userId: string;
  recommendations: Recommendation[];
  context: RecommendationContext;
  generatedAt: Date;
  algorithm: string;
  processingTime: number;
}

export interface RecommendationContext {
  // User Context
  timeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  dayOfWeek: number;
  location?: string;
  device: 'MOBILE' | 'DESKTOP' | 'TABLET';
  connection: 'WIFI' | 'MOBILE' | 'OFFLINE';
  
  // Activity Context
  activity: 'LISTENING' | 'WORKING' | 'EXERCISING' | 'RELAXING' | 'COMMUTING';
  socialContext: 'ALONE' | 'WITH_FRIENDS' | 'PARTY';
  
  // Music Context
  currentMood: string;
  recentPlays: string[];
  queue: string[];
  lastSkipped: string[];
  
  // Platform Context
  newReleases: boolean;
  trending: boolean;
  personalized: boolean;
}

export interface MoodPattern {
  mood: string;
  frequency: number;
  preferredGenres: string[];
  preferredTempo: number;
  preferredEnergy: number;
  timeSlots: string[];
}

export interface ListeningHabit {
  timeSlot: string;
  averageDuration: number;
  preferredContent: 'NEW' | 'FAMILIAR' | 'DISCOVERY';
  skipRate: number;
  completionRate: number;
}

export interface EngagementPattern {
  contentType: 'TRACK' | 'ALBUM' | 'PLAYLIST' | 'RADIO';
  engagementRate: number;
  repeatRate: number;
  shareRate: number;
  tipRate: number;
}

export interface FeedbackEvent {
  type: 'IMPRESSION' | 'CLICK' | 'PLAY' | 'SKIP' | 'COMPLETION' | 'SAVE' | 'SHARE' | 'TIP';
  recommendationId: string;
  timestamp: Date;
  context: RecommendationContext;
  metadata?: Record<string, any>;
}

export interface DiscoverySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  recommendationsShown: number;
  recommendationsEngaged: number;
  discoveryScore: number;
  mood: string;
  context: RecommendationContext;
  insights: DiscoveryInsight[];
}

export interface DiscoveryInsight {
  type: 'GENRE_EXPANSION' | 'ARTIST_DISCOVERY' | 'MOOD_EXPLORATION' | 'STYLE_EVOLUTION';
  description: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: string[];
}

// Algorithm-Specific Types
export interface CollaborativeFilteringResult {
  similarUsers: SimilarUser[];
  recommendedTracks: Recommendation[];
  algorithm: 'USER_BASED' | 'ITEM_BASED';
  similarityThreshold: number;
}

export interface ContentBasedResult {
  featureWeights: FeatureWeight[];
  recommendedTracks: Recommendation[];
  contentSimilarity: number;
}

export interface HybridResult {
  collaborativeWeight: number;
  contentWeight: number;
  contextualWeight: number;
  finalRecommendations: Recommendation[];
  componentScores: ComponentScore[];
}

export interface SimilarUser {
  userId: string;
  similarity: number;
  overlap: number;
  sharedPreferences: string[];
}

export interface FeatureWeight {
  feature: string;
  weight: number;
  importance: number;
}

export interface ComponentScore {
  algorithm: string;
  score: number;
  weight: number;
  contribution: number;
}

// Enums
export enum RecommendationType {
  TRACK = 'TRACK',
  ARTIST = 'ARTIST',
  PLAYLIST = 'PLAYLIST',
  RADIO = 'RADIO',
  COMPETITION = 'COMPETITION',
  COLLABORATION = 'COLLABORATION',
  GENRE = 'GENRE',
  MOOD = 'MOOD'
}

export enum RecommendationSource {
  COLLABORATIVE_FILTERING = 'COLLABORATIVE_FILTERING',
  CONTENT_BASED = 'CONTENT_BASED',
  TRENDING = 'TRENDING',
  SIMILAR_ARTISTS = 'SIMILAR_ARTISTS',
  GENRE_EXPLORATION = 'GENRE_EXPLORATION',
  MOOD_MATCHING = 'MOOD_MATCHING',
  CONTEXTUAL = 'CONTEXTUAL',
  DIVERSITY = 'DIVERSITY',
  SERENDIPITY = 'SERENDIPITY'
}

export enum TimePreference {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT'
}

export enum ActivityPreference {
  WORKING = 'WORKING',
  EXERCISING = 'EXERCISING',
  RELAXING = 'RELAXING',
  COMMUTING = 'COMMUTING',
  PARTY = 'PARTY'
}

// Real-time Recommendation Types
export interface RealTimeRecommendationConfig {
  enabled: boolean;
  updateFrequency: number;
  contextSensitivity: number;
  diversityWeight: number;
  noveltyWeight: number;
  confidenceThreshold: number;
}

export interface RecommendationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  coverage: number;
  novelty: number;
  diversity: number;
  serendipity: number;
  userSatisfaction: number;
  updateFrequency: number;
}

export interface A/BTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: RecommendationVariant[];
  targetAudience: string[];
  startDate: Date;
  endDate: Date;
  metrics: string[];
  isActive: boolean;
}

export interface RecommendationVariant {
  id: string;
  name: string;
  algorithm: string;
  parameters: Record<string, any>;
  weight: number;
}
