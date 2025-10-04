// frontend/components/brand/campaign-wizard.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrandStore } from '@/store/brand-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  Zap,
  CheckCircle
} from 'lucide-react';
import { CampaignType, CampaignObjective, TalentRequirements } from '@/types/brand';
import { formatCurrency } from '@/lib/utils';

const CAMPAIGN_TYPES = [
  {
    value: 'SPONSORED_TRACK',
    label: 'Sponsored Track',
    description: 'Sponsor an original music track with brand integration',
    icon: '🎵',
    budget: { min: 1000, max: 50000 }
  },
  {
    value: 'BRANDED_COMPETITION',
    label: 'Branded Competition',
    description: 'Host a music competition with your brand as the sponsor',
    icon: '🏆',
    budget: { min: 5000, max: 100000 }
  },
  {
    value: 'CONTENT_CREATION',
    label: 'Content Creation',
    description: 'Commission custom content for social media and marketing',
    icon: '🎬',
    budget: { min: 500, max: 20000 }
  },
  {
    value: 'BRAND_AMBASSADOR',
    label: 'Brand Ambassador',
    description: 'Long-term partnership with an artist as brand representative',
    icon: '⭐',
    budget: { min: 10000, max: 500000 }
  }
];

const OBJECTIVES = [
  { value: 'AWARENESS', label: 'Brand Awareness', description: 'Increase brand visibility and recognition' },
  { value: 'ENGAGEMENT', label: 'Engagement', description: 'Drive interaction and community building' },
  { value: 'CONVERSION', label: 'Conversion', description: 'Generate leads and drive sales' },
  { value: 'LOYALTY', label: 'Brand Loyalty', description: 'Strengthen relationships with existing customers' }
];

export function CampaignWizard() {
  const { createCampaign, isLoading } = useBrandStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    type: '' as CampaignType,
    objective: '' as CampaignObjective,
    
    // Step 2: Targeting
    targetAudience: {
      ageRange: [18, 35],
      locations: [] as string[],
      interests: [] as string[]
    },
    genreRequirements: [] as string[],
    talentRequirements: {
      minTalentScore: 6,
      minMonthlyListeners: 1000,
      minEngagementRate: 10
    } as TalentRequirements,
    
    // Step 3: Budget & Timeline
    budget: 5000,
    currency: 'USD',
    timeline: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      submissionDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    },
    
    // Step 4: Additional Details
    guidelines: '',
    deliverables: [] as string[],
    exclusivity: false
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await createCampaign({
        title: formData.title,
        description: formData.description,
        objective: formData.objective,
        type: formData.type,
        budget: formData.budget,
        targetAudience: formData.targetAudience,
        timeline: formData.timeline,
        requirements: formData.talentRequirements
      });
      
      // Success handling would go here
      setCurrentStep(5); // Success step
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <Target className="h-5 w-5" />;
      case 2: return <Users className="h-5 w-5" />;
      case 3: return <DollarSign className="h-5 w-5" />;
      case 4: return <Zap className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card variant="glass" className="backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Create Campaign</h2>
              <p className="text-gray-400">Step {currentStep} of {totalSteps}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Progress</div>
              <div className="text-lg font-bold text-primary-500">{Math.round(progress)}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-dark-700 rounded-full h-2">
            <motion.div
              className="bg-primary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    step < currentStep
                      ? "bg-green-500 text-white"
                      : step === currentStep
                      ? "bg-primary-500 text-white ring-4 ring-primary-500/20"
                      : "bg-dark-700 text-gray-400"
                  )}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    getStepIcon(step)
                  )}
                </div>
                <div className={cn(
                  "text-xs mt-2 font-medium",
                  step <= currentStep ? "text-white" : "text-gray-400"
                )}>
                  Step {step}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <CampaignBasicInfo
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 2 && (
            <CampaignTargeting
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 3 && (
            <CampaignBudget
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 4 && (
            <CampaignReview
              formData={formData}
              onSubmit={handleSubmit}
            />
          )}
          
          {currentStep === 5 && (
            <CampaignSuccess />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep <= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between pt-6"
        >
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid(currentStep, formData)}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isStepValid(currentStep, formData)}
              isLoading={isLoading}
              className="flex items-center gap-2"
            >
              Create Campaign
              <Zap className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Step Validation
function isStepValid(step: number, formData: any): boolean {
  switch (step) {
    case 1:
      return !!formData.title && !!formData.description && !!formData.type && !!formData.objective;
    case 2:
      return formData.genreRequirements.length > 0;
    case 3:
      return formData.budget >= 100;
    case 4:
      return true;
    default:
      return false;
  }
}

// Step 1: Basic Information
function CampaignBasicInfo({ formData, updateFormData }: any) {
  const selectedType = CAMPAIGN_TYPES.find(t => t.value === formData.type);

  return (
    <Card variant="glass" className="backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-500" />
          Campaign Basics
        </CardTitle>
        <CardDescription>
          Define your campaign's core identity and objectives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title & Description */}
        <div className="space-y-4">
          <Input
            label="Campaign Title"
            placeholder="e.g., Summer Vibes Music Partnership"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
          />
          
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Description
            </label>
            <textarea
              placeholder="Describe your campaign goals, brand values, and what you're looking for in artists..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className="w-full rounded-xl border border-dark-600 bg-dark-800/50 px-4 py-3 text-white focus:border-primary-500 focus:ring-primary-500 transition-colors min-h-[100px]"
            />
          </div>
        </div>

        {/* Campaign Type */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">
            Campaign Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPAIGN_TYPES.map((type) => (
              <motion.button
                key={type.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData({ type: type.value })}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  formData.type === type.value
                    ? "border-primary-500 bg-primary-500/20"
                    : "border-dark-600 bg-dark-800/50 hover:border-primary-500/50"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{type.label}</div>
                    <div className="text-xs text-gray-400">
                      Budget: {formatCurrency(type.budget.min, 'USD')} - {formatCurrency(type.budget.max, 'USD')}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{type.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Objectives */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">
            Primary Objective
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OBJECTIVES.map((objective) => (
              <button
                key={objective.value}
                onClick={() => updateFormData({ objective: objective.value })}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  formData.objective === objective.value
                    ? "border-primary-500 bg-primary-500/20 text-primary-500"
                    : "border-dark-600 bg-dark-800/50 text-gray-400 hover:border-primary-500/50 hover:text-white"
                )}
              >
                <div className="font-medium">{objective.label}</div>
                <div className="text-xs mt-1">{objective.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Type Preview */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedType.icon}</span>
              <div>
                <div className="font-semibold text-primary-500">{selectedType.label}</div>
                <div className="text-sm text-primary-400">
                  Recommended budget: {formatCurrency(selectedType.budget.min, 'USD')} - {formatCurrency(selectedType.budget.max, 'USD')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Additional step components would be implemented similarly...
// CampaignTargeting, CampaignBudget, CampaignReview, CampaignSuccess

function CampaignTargeting({ formData, updateFormData }: any) {
  return <div>Targeting Step - Implementation would go here</div>;
}

function CampaignBudget({ formData, updateFormData }: any) {
  return <div>Budget Step - Implementation would go here</div>;
}

function CampaignReview({ formData, onSubmit }: any) {
  return <div>Review Step - Implementation would go here</div>;
}

function CampaignSuccess() {
  return (
    <Card variant="glass" className="backdrop-blur-xl text-center">
      <CardContent className="p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="h-8 w-8 text-green-500" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">Campaign Created!</h3>
        <p className="text-gray-400 mb-6">
          Your campaign has been successfully created and is now live for artists to discover and apply.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <a href="/brand/campaigns">View Campaigns</a>
          </Button>
          <Button asChild>
            <a href="/brand/campaigns/create">Create Another</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
