// Feature flags - easily toggle features on/off
// When you're ready to enable a feature, just change the value to true

export const FEATURES = {
  // Engagement features - disabled until more fans join
  LIKES_ENABLED: false,
  COMMENTS_ENABLED: false,
  
  // Geographic restrictions
  KENYA_ONLY_SIGNUP: true,
  
  // Player features
  SHUFFLE_MODE: true,
  REPEAT_MODE: true,
  KEYBOARD_SHORTCUTS: true,
} as const;

// Type for feature flag keys
export type FeatureFlag = keyof typeof FEATURES;

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature];
}
