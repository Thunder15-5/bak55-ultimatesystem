// frontend/types/localization.ts
export interface LocalizationConfig {
  defaultLanguage: string;
  supportedLanguages: Language[];
  fallbackLanguage: string;
  autoDetect: boolean;
  persistence: 'localStorage' | 'cookie' | 'sessionStorage';
  currency: {
    default: string;
    autoConvert: boolean;
  };
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  timezone: string;
  enabled: boolean;
  completion: number; // Translation completion percentage
}

export interface TranslationNamespace {
  common: CommonTranslations;
  auth: AuthTranslations;
  wallet: WalletTranslations;
  competition: CompetitionTranslations;
  artist: ArtistTranslations;
  ai: AITranslations;
  admin: AdminTranslations;
  errors: ErrorTranslations;
}

export interface CommonTranslations {
  // Navigation
  home: string;
  discover: string;
  competitions: string;
  artists: string;
  wallet: string;
  profile: string;
  
  // Actions
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  submit: string;
  loading: string;
  
  // Time
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  
  // Currency
  currency: string;
  bakCoins: string;
}

export interface AuthTranslations {
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  // ... more auth translations
}

export interface WalletTranslations {
  balance: string;
  deposit: string;
  withdraw: string;
  transactionHistory: string;
  // ... more wallet translations
}

// Additional translation interfaces for each namespace...

export interface LocalizedContent {
  id: string;
  type: 'genre' | 'theme' | 'competition' | 'article';
  translations: {
    [language: string]: {
      title: string;
      description?: string;
      content?: string;
    };
  };
  metadata: {
    culturallyAdapted: boolean;
    regionSpecific: boolean;
    lastUpdated: Date;
    adaptedBy: string;
  };
}

export interface CulturalAdaptation {
  region: string;
  adaptations: {
    imagery: string[];
    colors: string[];
    musicGenres: string[];
    contentThemes: string[];
    culturalReferences: string[];
  };
  restrictions: {
    sensitiveTopics: string[];
    culturalTaboos: string[];
    legalRequirements: string[];
  };
}

export interface RegionalConfig {
  country: string;
  currency: string;
  paymentMethods: string[];
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  phoneFormat: string;
  addressFormat: string;
  taxConfig: TaxConfig;
  compliance: ComplianceConfig;
}

export interface TaxConfig {
  vatRate: number;
  withholdingTax: number;
  taxIdRequired: boolean;
  taxForms: string[];
}

export interface ComplianceConfig {
  kycRequired: boolean;
  kycLevel: 'BASIC' | 'STANDARD' | 'ENHANCED';
  dataResidency: boolean;
  localAudit: boolean;
}
