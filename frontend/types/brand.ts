// frontend/types/brand.ts
export interface BrandProfile {
  id: string;
  userId: string;
  user: User;
  
  // Brand Identity
  companyName: string;
  logo: string;
  industry: string;
  description: string;
  website: string;
  headquarters: string;
  
  // Brand Metrics
  brandValue: number;
  socialMediaReach: number;
  targetAudience: AudienceDemographics;
  brandValues: string[];
  
  // Partnership Preferences
  preferredGenres: string[];
  targetRegions: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  campaignTypes: CampaignType[];
  
  // Performance Metrics
  totalCampaigns: number;
  successRate: number;
  totalInvestment: number;
  avgROI: number;
  
  // Verification & Compliance
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  complianceDocuments: ComplianceDocument[];
  kycStatus: KYCStatus;
  
  // Timestamps
  joinedAt: Date;
  lastActive: Date;
  updatedAt: Date;
}

export interface BrandCampaign {
  id: string;
  brandId: string;
  brand: BrandProfile;
  
  // Campaign Details
  title: string;
  description: string;
  objective: CampaignObjective;
  type: CampaignType;
  theme: string;
  guidelines: string;
  
  // Targeting
  targetAudience: AudienceTargeting;
  genreRequirements: string[];
  talentRequirements: TalentRequirements;
  geographicTargeting: GeographicTargeting;
  
  // Financials
  budget: number;
  currency: string;
  paymentStructure: PaymentStructure;
  performanceBonuses: PerformanceBonus[];
  
  // Timeline
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  reviewPeriod: number; // days
  
  // Status & Management
  status: CampaignStatus;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  approvedArtists: string[];
  submissions: CampaignSubmission[];
  
  // Performance Tracking
  metrics: CampaignMetrics;
  roi: number;
  engagement: EngagementMetrics;
  
  // Legal
  contractTemplate: string;
  rightsUsage: RightsUsage;
  exclusivity: ExclusivityTerms;
  
  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSubmission {
  id: string;
  campaignId: string;
  artistId: string;
  artist: Artist;
  
  // Submission Content
  proposal: string;
  portfolioItems: PortfolioItem[];
  customTrack?: AudioTrack;
  message: string;
  
  // Pricing
  askingPrice: number;
  counterOffer?: number;
  finalPrice?: number;
  
  // Status
  status: SubmissionStatus;
  reviewScore?: number;
  feedback?: string;
  
  // Contract
  contractStatus: ContractStatus;
  signedContract?: string;
  contractTerms?: ContractTerms;
  
  // Performance
  deliverables: Deliverable[];
  completionStatus: CompletionStatus;
  
  // Timestamps
  submittedAt: Date;
  reviewedAt?: Date;
  contractedAt?: Date;
  completedAt?: Date;
}

export interface RightsUsage {
  duration: string; // "1 year", "perpetual", etc.
  territories: string[];
  platforms: string[];
  exclusivity: boolean;
  modifications: boolean;
  sublicensing: boolean;
}

export interface ExclusivityTerms {
  categoryExclusivity: boolean;
  duration: string;
  competingBrands: string[];
}

export interface TalentRequirements {
  minTalentScore: number;
  minMonthlyListeners: number;
  minEngagementRate: number;
  requiredSkills: string[];
  preferredGenres: string[];
  locationPreferences: string[];
}

export interface PaymentStructure {
  type: 'FIXED' | 'ROYALTY' | 'HYBRID' | 'PERFORMANCE';
  upfrontAmount?: number;
  royaltyRate?: number;
  bonusStructure?: BonusTier[];
  paymentSchedule: PaymentMilestone[];
}

export interface PerformanceBonus {
  metric: 'ENGAGEMENT' | 'CONVERSIONS' | 'REACH' | 'SALES';
  target: number;
  bonus: number;
}

export interface CampaignMetrics {
  reach: number;
  engagement: number;
  conversions: number;
  roi: number;
  costPerEngagement: number;
  artistSatisfaction: number;
}

export interface PortfolioItem {
  id: string;
  type: 'TRACK' | 'VIDEO' | 'IMAGE' | 'CASE_STUDY';
  title: string;
  description: string;
  url: string;
  metrics?: PortfolioMetrics;
}

export interface PortfolioMetrics {
  plays?: number;
  likes?: number;
  shares?: number;
  completionRate?: number;
  engagementRate?: number;
}

// Advanced Matching Types
export interface BrandArtistMatch {
  artist: Artist;
  brand: BrandProfile;
  matchScore: number;
  compatibility: {
    audience: number;
    values: number;
    genre: number;
    style: number;
  };
  opportunity: OpportunityAnalysis;
  risks: RiskAssessment[];
  recommendations: MatchRecommendation[];
}

export interface OpportunityAnalysis {
  potentialReach: number;
  estimatedValue: number;
  strategicAlignment: number;
  competitiveAdvantage: string[];
}

export interface RiskAssessment {
  type: 'AUDIENCE_MISMATCH' | 'BRAND_RISK' | 'CONTRACT_COMPLEXITY' | 'PERFORMANCE';
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  mitigation: string;
}

export interface MatchRecommendation {
  type: 'STRATEGY' | 'NEGOTIATION' | 'CREATIVE' | 'MARKETING';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Enterprise Analytics
export interface BrandAnalytics {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalInvestment: number;
    avgROI: number;
    successRate: number;
  };
  performance: {
    byCampaignType: CampaignTypePerformance[];
    byGenre: GenrePerformance[];
    byRegion: RegionPerformance[];
    overTime: TimeSeriesData[];
  };
  artistPerformance: {
    topPerforming: ArtistPerformance[];
    mostReliable: ArtistPerformance[];
    bestROI: ArtistPerformance[];
  };
  financials: {
    spending: FinancialBreakdown;
    returns: FinancialBreakdown;
    projections: FinancialProjection[];
  };
}

export interface CampaignTypePerformance {
  type: CampaignType;
  count: number;
  totalInvestment: number;
  avgROI: number;
  successRate: number;
}

// Enums
export enum CampaignType {
  SPONSORED_TRACK = 'SPONSORED_TRACK',
  BRANDED_COMPETITION = 'BRANDED_COMPETITION',
  CONTENT_CREATION = 'CONTENT_CREATION',
  SOCIAL_MEDIA_TAKEOVER = 'SOCIAL_MEDIA_TAKEOVER',
  LIVE_EVENT = 'LIVE_EVENT',
  PRODUCT_PLACEMENT = 'PRODUCT_PLACEMENT',
  BRAND_AMBASSADOR = 'BRAND_AMBASSADOR',
  EXCLUSIVE_RELEASE = 'EXCLUSIVE_RELEASE'
}

export enum CampaignObjective {
  AWARENESS = 'AWARENESS',
  ENGAGEMENT = 'ENGAGEMENT',
  CONVERSION = 'CONVERSION',
  LEAD_GENERATION = 'LEAD_GENERATION',
  SALES = 'SALES',
  BRAND_LOYALTY = 'BRAND_LOYALTY'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  REVIEWING = 'REVIEWING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED'
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONTRACTED = 'CONTRACTED'
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  NEGOTIATING = 'NEGOTIATING',
  SIGNED = 'SIGNED',
  EXECUTED = 'EXECUTED',
  TERMINATED = 'TERMINATED'
}

export enum CompletionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REVISIONS_NEEDED = 'REVISIONS_NEEDED',
  COMPLETED = 'COMPLETED'
}
