// frontend/store/brand-store.ts
import { create } from 'zustand';
import { 
  BrandProfile, 
  BrandCampaign, 
  CampaignSubmission, 
  BrandArtistMatch,
  BrandAnalytics 
} from '@/types/brand';

interface BrandState {
  // Core State
  brandProfile: BrandProfile | null;
  campaigns: BrandCampaign[];
  submissions: CampaignSubmission[];
  matches: BrandArtistMatch[];
  analytics: BrandAnalytics | null;
  
  // UI State
  isLoading: boolean;
  activeTab: 'dashboard' | 'campaigns' | 'artists' | 'analytics' | 'contracts';
  filters: BrandFilters;
  
  // Actions - Brand Management
  fetchBrandProfile: () => Promise<void>;
  updateBrandProfile: (updates: Partial<BrandProfile>) => Promise<void>;
  verifyBrand: () => Promise<void>;
  
  // Campaign Management
  createCampaign: (campaignData: CreateCampaignData) => Promise<BrandCampaign>;
  updateCampaign: (campaignId: string, updates: Partial<BrandCampaign>) => Promise<void>;
  publishCampaign: (campaignId: string) => Promise<void>;
  pauseCampaign: (campaignId: string) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  
  // Submission Management
  fetchSubmissions: (campaignId: string) => Promise<void>;
  reviewSubmission: (submissionId: string, review: SubmissionReview) => Promise<void>;
  shortlistArtist: (submissionId: string) => Promise<void>;
  approveSubmission: (submissionId: string, contractTerms: ContractTerms) => Promise<void>;
  
  // Matching & Discovery
  findArtistMatches: (campaignId: string, filters?: MatchFilters) => Promise<BrandArtistMatch[]>;
  inviteArtist: (campaignId: string, artistId: string, message?: string) => Promise<void>;
  getCompatibilityScore: (brandId: string, artistId: string) => Promise<number>;
  
  // Contract Management
  generateContract: (submissionId: string, template: string) => Promise<string>;
  sendContract: (submissionId: string) => Promise<void>;
  trackContract: (contractId: string) => Promise<ContractStatus>;
  
  // Analytics & Reporting
  fetchAnalytics: (timeframe: string) => Promise<void>;
  generateReport: (reportType: string, options: ReportOptions) => Promise<string>;
  getROICalculator: (campaignId: string) => ROICalculation;
  
  // Enterprise Features
  bulkInvite: (campaignId: string, artistIds: string[]) => Promise<void>;
  createCampaignTemplate: (template: CampaignTemplate) => Promise<void>;
  cloneCampaign: (campaignId: string, modifications?: Partial<BrandCampaign>) => Promise<BrandCampaign>;
}

interface BrandFilters {
  status?: string;
  type?: string;
  budgetMin?: number;
  budgetMax?: number;
  dateRange?: { start: Date; end: Date };
}

interface CreateCampaignData {
  title: string;
  description: string;
  objective: CampaignObjective;
  type: CampaignType;
  budget: number;
  targetAudience: AudienceTargeting;
  timeline: {
    startDate: Date;
    endDate: Date;
    submissionDeadline: Date;
  };
  requirements: TalentRequirements;
}

interface SubmissionReview {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  recommendation: 'APPROVE' | 'REJECT' | 'SHORTLIST';
}

interface MatchFilters {
  minTalentScore?: number;
  genres?: string[];
  location?: string[];
  audienceOverlap?: number;
  budgetRange?: { min: number; max: number };
}

interface ROICalculation {
  estimatedReach: number;
  estimatedEngagement: number;
  estimatedCost: number;
  projectedROI: number;
  breakEvenPoint: number;
  sensitivityAnalysis: SensitivityAnalysis[];
}

interface SensitivityAnalysis {
  variable: string;
  baseValue: number;
  impactOnROI: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const useBrandStore = create<BrandState>((set, get) => ({
  // Initial State
  brandProfile: null,
  campaigns: [],
  submissions: [],
  matches: [],
  analytics: null,
  isLoading: false,
  activeTab: 'dashboard',
  filters: {},

  // Fetch Brand Profile
  fetchBrandProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/brand/profile');
      if (!response.ok) throw new Error('Failed to fetch brand profile');
      
      const brandProfile = await response.json();
      set({ brandProfile, isLoading: false });
    } catch (error) {
      console.error('Error fetching brand profile:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Update Brand Profile
  updateBrandProfile: async (updates: Partial<BrandProfile>) => {
    try {
      const response = await fetch('/api/brand/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedProfile = await response.json();
      set({ brandProfile: updatedProfile });
    } catch (error) {
      console.error('Error updating brand profile:', error);
      throw error;
    }
  },

  // Verify Brand
  verifyBrand: async () => {
    try {
      const response = await fetch('/api/brand/verify', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      set(state => ({
        brandProfile: state.brandProfile ? {
          ...state.brandProfile,
          verificationStatus: 'PENDING'
        } : null
      }));
    } catch (error) {
      console.error('Error verifying brand:', error);
      throw error;
    }
  },

  // Create Campaign
  createCampaign: async (campaignData: CreateCampaignData): Promise<BrandCampaign> => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const campaign = await response.json();
      set(state => ({ 
        campaigns: [campaign, ...state.campaigns],
        isLoading: false 
      }));
      
      return campaign;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Update Campaign
  updateCampaign: async (campaignId: string, updates: Partial<BrandCampaign>) => {
    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedCampaign = await response.json();
      set(state => ({
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId ? updatedCampaign : campaign
        )
      }));
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  // Publish Campaign
  publishCampaign: async (campaignId: string) => {
    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      set(state => ({
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId 
            ? { ...campaign, status: 'PUBLISHED' }
            : campaign
        )
      }));
    } catch (error) {
      console.error('Error publishing campaign:', error);
      throw error;
    }
  },

  // Fetch Submissions
  fetchSubmissions: async (campaignId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      
      const submissions = await response.json();
      set({ submissions, isLoading: false });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Review Submission
  reviewSubmission: async (submissionId: string, review: SubmissionReview) => {
    try {
      const response = await fetch(`/api/brand/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedSubmission = await response.json();
      set(state => ({
        submissions: state.submissions.map(submission =>
          submission.id === submissionId ? updatedSubmission : submission
        )
      }));
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw error;
    }
  },

  // Find Artist Matches
  findArtistMatches: async (campaignId: string, filters?: MatchFilters): Promise<BrandArtistMatch[]> => {
    set({ isLoading: true });
    try {
      const queryParams = new URLSearchParams();
      if (filters?.minTalentScore) queryParams.append('minTalentScore', filters.minTalentScore.toString());
      if (filters?.genres) queryParams.append('genres', filters.genres.join(','));
      if (filters?.location) queryParams.append('location', filters.location.join(','));

      const response = await fetch(`/api/brand/campaigns/${campaignId}/matches?${queryParams}`);
      if (!response.ok) throw new Error('Failed to find artist matches');
      
      const matches = await response.json();
      set({ matches, isLoading: false });
      return matches;
    } catch (error) {
      console.error('Error finding artist matches:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Invite Artist
  inviteArtist: async (campaignId: string, artistId: string, message?: string) => {
    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error inviting artist:', error);
      throw error;
    }
  },

  // Generate Contract
  generateContract: async (submissionId: string, template: string): Promise<string> => {
    try {
      const response = await fetch(`/api/brand/submissions/${submissionId}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { contractUrl } = await response.json();
      return contractUrl;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },

  // Fetch Analytics
  fetchAnalytics: async (timeframe: string = '30d') => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/brand/analytics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analytics = await response.json();
      set({ analytics, isLoading: false });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Generate Report
  generateReport: async (reportType: string, options: ReportOptions): Promise<string> => {
    try {
      const response = await fetch('/api/brand/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, options }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { reportUrl } = await response.json();
      return reportUrl;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // ROI Calculator
  getROICalculator: (campaignId: string): ROICalculation => {
    const campaign = get().campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Simplified ROI calculation - in real implementation, this would use more sophisticated models
    const estimatedReach = campaign.targetAudience.size * 0.1; // 10% engagement assumption
    const estimatedEngagement = estimatedReach * 0.05; // 5% conversion assumption
    const estimatedCost = campaign.budget;
    const projectedValue = estimatedEngagement * 100; // $100 value per engagement
    const projectedROI = ((projectedValue - estimatedCost) / estimatedCost) * 100;

    return {
      estimatedReach,
      estimatedEngagement,
      estimatedCost,
      projectedROI,
      breakEvenPoint: estimatedCost / 100, // engagements needed to break even
      sensitivityAnalysis: [
        {
          variable: 'Engagement Rate',
          baseValue: 0.1,
          impactOnROI: 25,
          riskLevel: 'MEDIUM'
        },
        {
          variable: 'Conversion Rate',
          baseValue: 0.05,
          impactOnROI: 40,
          riskLevel: 'HIGH'
        },
        {
          variable: 'Cost Per Engagement',
          baseValue: 10,
          impactOnROI: -30,
          riskLevel: 'LOW'
        }
      ]
    };
  },

  // Bulk Invite
  bulkInvite: async (campaignId: string, artistIds: string[]) => {
    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/bulk-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error bulk inviting artists:', error);
      throw error;
    }
  },

  // Clone Campaign
  cloneCampaign: async (campaignId: string, modifications?: Partial<BrandCampaign>): Promise<BrandCampaign> => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const clonedCampaign = await response.json();
      set(state => ({ 
        campaigns: [clonedCampaign, ...state.campaigns],
        isLoading: false 
      }));
      
      return clonedCampaign;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Placeholder for other methods
  pauseCampaign: async (campaignId: string) => { /* implementation */ },
  deleteCampaign: async (campaignId: string) => { /* implementation */ },
  shortlistArtist: async (submissionId: string) => { /* implementation */ },
  approveSubmission: async (submissionId: string, contractTerms: ContractTerms) => { /* implementation */ },
  getCompatibilityScore: async (brandId: string, artistId: string) => { /* implementation */ },
  sendContract: async (submissionId: string) => { /* implementation */ },
  trackContract: async (contractId: string) => { /* implementation */ },
  createCampaignTemplate: async (template: CampaignTemplate) => { /* implementation */ },
}));
