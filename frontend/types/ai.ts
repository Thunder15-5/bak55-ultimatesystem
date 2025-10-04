// frontend/types/ai.ts
export interface AITalentAnalysis {
  id: string;
  trackId: string;
  artistId: string;
  
  // Core Talent Scores (0-10)
  overallScore: number;
  scoreBreakdown: {
    vocalQuality: AIScoreDimension;
    musicality: AIScoreDimension;
    originality: AIScoreDimension;
    productionQuality: AIScoreDimension;
    marketPotential: AIScoreDimension;
  };
  
  // Detailed Analysis
  vocalAnalysis: VocalAnalysis;
  musicalAnalysis: MusicalAnalysis;
  productionAnalysis: ProductionAnalysis;
  marketAnalysis: MarketAnalysis;
  
  // Comparative Analytics
  genreBenchmark: {
    average: number;
    percentile: number;
    topArtists: string[];
  };
  
  // Recommendations
  strengths: string[];
  improvements: ImprovementArea[];
  careerSuggestions: CareerSuggestion[];
  
  // Metadata
  analysisVersion: string;
  confidence: number;
  processedAt: Date;
  expiresAt: Date;
}

export interface AIScoreDimension {
  score: number;
  confidence: number;
  factors: ScoreFactor[];
  explanation: string;
  trend?: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface ScoreFactor {
  aspect: string;
  score: number;
  weight: number;
  evidence: string[];
}

export interface VocalAnalysis {
  pitchAccuracy: number;
  toneQuality: number;
  vocalRange: number;
  breathControl: number;
  emotionalDelivery: number;
  technicalNotes: string[];
  styleAssessment: string;
}

export interface MusicalAnalysis {
  rhythmComplexity: number;
  melodicCreativity: number;
  harmonicSophistication: number;
  dynamicControl: number;
  genreAlignment: number;
  structuralAnalysis: string;
  innovationScore: number;
}

export interface ProductionAnalysis {
  mixingQuality: number;
  masteringLevel: number;
  instrumentation: number;
  recordingQuality: number;
  overallPolish: number;
  technicalIssues: TechnicalIssue[];
  equipmentSuggestions: string[];
}

export interface MarketAnalysis {
  targetAudience: string[];
  commercialPotential: number;
  viralProbability: number;
  platformFit: PlatformFit[];
  trendAlignment: TrendAlignment[];
  competitorComparison: CompetitorComparison[];
}

export interface ImprovementArea {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentLevel: number;
  targetLevel: number;
  actionSteps: string[];
  resources: LearningResource[];
  estimatedTimeline: string;
  potentialImpact: number;
}

export interface CareerSuggestion {
  type: 'COMPETITION' | 'COLLABORATION' | 'SKILL_DEVELOPMENT' | 'CONTENT_STRATEGY' | 'MARKETING';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  actionSteps: string[];
}

export interface TechnicalIssue {
  type: 'NOISE' | 'CLIPPING' | 'PHASING' | 'COMPRESSION' | 'EQ';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp?: number;
  description: string;
  fix: string;
}

export interface PlatformFit {
  platform: 'SPOTIFY' | 'APPLE_MUSIC' | 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM';
  score: number;
  reasoning: string;
  audienceSize: number;
}

export interface TrendAlignment {
  trend: string;
  alignment: number;
  relevance: number;
  opportunity: number;
}

export interface CompetitorComparison {
  artistName: string;
  similarity: number;
  competitiveAdvantage: string[];
  areasToLearn: string[];
}

// Real-time Analysis Types
export interface RealTimeAnalysisConfig {
  enabled: boolean;
  updateFrequency: number; // milliseconds
  metrics: AnalysisMetric[];
  thresholds: {
    quality: number;
    originality: number;
    marketFit: number;
  };
}

export interface AnalysisMetric {
  id: string;
  name: string;
  description: string;
  value: number;
  trend: number;
  unit: string;
}

export interface AIPerformanceBenchmark {
  metric: string;
  artistScore: number;
  genreAverage: number;
  platformAverage: number;
  top10Percentile: number;
  improvementPotential: number;
}

// AI Model Management
export interface AIModel {
  id: string;
  name: string;
  version: string;
  type: 'TALENT_SCORING' | 'RECOMMENDATION' | 'TREND_ANALYSIS';
  accuracy: number;
  latency: number;
  lastUpdated: Date;
  isActive: boolean;
  features: string[];
}

export interface AnalysisRequest {
  trackId: string;
  audioUrl: string;
  metadata: {
    duration: number;
    format: string;
    sampleRate: number;
    bitrate: number;
  };
  artistInfo: {
    genre: string;
    experience: string;
    location: string;
  };
  config: {
    detailed: boolean;
    realtime: boolean;
    benchmarks: boolean;
  };
}

export interface AnalysisResponse {
  analysis: AITalentAnalysis;
  processingTime: number;
  modelVersion: string;
  cost: number;
  cacheKey?: string;
}
