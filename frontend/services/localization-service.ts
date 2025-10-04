// frontend/services/localization-service.ts
import { LocalizationConfig, Language, TranslationNamespace, RegionalConfig } from '@/types/localization';

class LocalizationService {
  private config: LocalizationConfig;
  private currentLanguage: string;
  private translations: Map<string, any> = new Map();
  private regionalConfigs: Map<string, RegionalConfig> = new Map();
  private listeners: Set<(lang: string) => void> = new Set();

  constructor() {
    this.config = {
      defaultLanguage: 'en',
      supportedLanguages: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          region: 'US',
          flag: '🇺🇸',
          direction: 'ltr',
          currency: 'USD',
          timezone: 'UTC',
          enabled: true,
          completion: 100
        },
        {
          code: 'sw',
          name: 'Swahili',
          nativeName: 'Kiswahili',
          region: 'KE',
          flag: '🇰🇪',
          direction: 'ltr',
          currency: 'KES',
          timezone: 'Africa/Nairobi',
          enabled: true,
          completion: 85
        },
        {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          region: 'FR',
          flag: '🇫🇷',
          direction: 'ltr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          enabled: true,
          completion: 90
        },
        {
          code: 'pt',
          name: 'Portuguese',
          nativeName: 'Português',
          region: 'PT',
          flag: '🇵🇹',
          direction: 'ltr',
          currency: 'EUR',
          timezone: 'Europe/Lisbon',
          enabled: true,
          completion: 80
        },
        {
          code: 'yo',
          name: 'Yoruba',
          nativeName: 'Yorùbá',
          region: 'NG',
          flag: '🇳🇬',
          direction: 'ltr',
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          enabled: true,
          completion: 60
        },
        {
          code: 'ar',
          name: 'Arabic',
          nativeName: 'العربية',
          region: 'EG',
          flag: '🇪🇬',
          direction: 'rtl',
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          enabled: true,
          completion: 75
        },
        {
          code: 'am',
          name: 'Amharic',
          nativeName: 'አማርኛ',
          region: 'ET',
          flag: '🇪🇹',
          direction: 'ltr',
          currency: 'ETB',
          timezone: 'Africa/Addis_Ababa',
          enabled: true,
          completion: 55
        },
        {
          code: 'zu',
          name: 'Zulu',
          nativeName: 'isiZulu',
          region: 'ZA',
          flag: '🇿🇦',
          direction: 'ltr',
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg',
          enabled: true,
          completion: 50
        }
      ],
      fallbackLanguage: 'en',
      autoDetect: true,
      persistence: 'localStorage',
      currency: {
        default: 'USD',
        autoConvert: true
      }
    };

    this.initializeRegionalConfigs();
    this.loadLanguage();
  }

  private initializeRegionalConfigs(): void {
    // East Africa
    this.regionalConfigs.set('KE', {
      country: 'Kenya',
      currency: 'KES',
      paymentMethods: ['MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CARD'],
      timezone: 'Africa/Nairobi',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'en-KE',
      phoneFormat: '+254 XXX XXX XXX',
      addressFormat: 'Street, City, Postal Code',
      taxConfig: {
        vatRate: 16,
        withholdingTax: 5,
        taxIdRequired: true,
        taxForms: ['KRA PIN Certificate']
      },
      compliance: {
        kycRequired: true,
        kycLevel: 'STANDARD',
        dataResidency: false,
        localAudit: true
      }
    });

    this.regionalConfigs.set('TZ', {
      country: 'Tanzania',
      currency: 'TZS',
      paymentMethods: ['MPESA', 'TIGO_PESA', 'AIRTEL_MONEY', 'BANK_TRANSFER'],
      timezone: 'Africa/Dar_es_Salaam',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'en-TZ',
      phoneFormat: '+255 XXX XXX XXX',
      addressFormat: 'Street, City, Postal Code',
      taxConfig: {
        vatRate: 18,
        withholdingTax: 5,
        taxIdRequired: true,
        taxForms: ['TIN Certificate']
      },
      compliance: {
        kycRequired: true,
        kycLevel: 'STANDARD',
        dataResidency: false,
        localAudit: true
      }
    });

    // West Africa
    this.regionalConfigs.set('NG', {
      country: 'Nigeria',
      currency: 'NGN',
      paymentMethods: ['BANK_TRANSFER', 'USSD', 'CARD', 'CRYPTO'],
      timezone: 'Africa/Lagos',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'en-NG',
      phoneFormat: '+234 XXX XXX XXXX',
      addressFormat: 'Street, City, State, Postal Code',
      taxConfig: {
        vatRate: 7.5,
        withholdingTax: 10,
        taxIdRequired: true,
        taxForms: ['TIN Certificate', 'BVN']
      },
      compliance: {
        kycRequired: true,
        kycLevel: 'ENHANCED',
        dataResidency: true,
        localAudit: true
      }
    });

    this.regionalConfigs.set('GH', {
      country: 'Ghana',
      currency: 'GHS',
      paymentMethods: ['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'],
      timezone: 'Africa/Accra',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'en-GH',
      phoneFormat: '+233 XXX XXX XXX',
      addressFormat: 'Street, City, Postal Code',
      taxConfig: {
        vatRate: 12.5,
        withholdingTax: 5,
        taxIdRequired: true,
        taxForms: ['TIN Certificate']
      },
      compliance: {
        kycRequired: true,
        kycLevel: 'STANDARD',
        dataResidency: false,
        localAudit: true
      }
    });

    // Southern Africa
    this.regionalConfigs.set('ZA', {
      country: 'South Africa',
      currency: 'ZAR',
      paymentMethods: ['BANK_TRANSFER', 'SNAPSCAN', 'CARD', 'CRYPTO'],
      timezone: 'Africa/Johannesburg',
      dateFormat: 'yyyy/MM/dd',
      numberFormat: 'en-ZA',
      phoneFormat: '+27 XX XXX XXXX',
      addressFormat: 'Street, Suburb, City, Postal Code',
      taxConfig: {
        vatRate: 15,
        withholdingTax: 15,
        taxIdRequired: true,
        taxForms: ['SARS Tax Certificate', 'ID Document']
      },
      compliance: {
        kycRequired: true,
        kycLevel: 'ENHANCED',
        dataResidency: true,
        localAudit: true
      }
    });

    // North Africa
    this.regionalConfigs.set('EG', {
      country: 'Egypt',
      currency: 'EGP',
      paymentMethods: ['BANK_TRANSFER', 'MOBILE_WALLET', 'CARD'],
      timezone: 'Africa/Cairo',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: 'ar-EG',
      phoneFormat: '+20 XXX XXX XXXX',
      addressFormat: 'Street, District, City, Postal Code',
      taxConfig: {
        vatRate: 14,
        withholdingTax: 10,
        taxIdRequired: true,
        taxForms: ['Tax Card', 'Commercial Register']
      },
      compliance: {
        kycRequired: true,
        kycLevel: 'ENHANCED',
        dataResidency: true,
        localAudit: true
      }
    });
  }

  async initialize(): Promise<void> {
    // Auto-detect language from browser or IP
    if (this.config.autoDetect) {
      const detectedLang = await this.detectLanguage();
      this.setLanguage(detectedLang);
    }

    // Load initial translations
    await this.loadTranslations(this.currentLanguage);
  }

  private async detectLanguage(): Promise<string> {
    // 1. Check stored preference
    const stored = this.getStoredLanguage();
    if (stored) return stored;

    // 2. Check browser language
    const browserLang = navigator.language.split('-')[0];
    const supportedBrowserLang = this.config.supportedLanguages.find(
      lang => lang.code === browserLang && lang.enabled
    );
    if (supportedBrowserLang) return browserLang;

    // 3. Geo-IP detection (simplified - in real app, this would be an API call)
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const country = data.country_code;
      
      // Map country to language
      const countryLanguageMap: { [key: string]: string } = {
        'KE': 'sw', 'TZ': 'sw', 'UG': 'sw', // Swahili regions
        'NG': 'en', 'GH': 'en', // English West Africa
        'ZA': 'en', // English Southern Africa
        'EG': 'ar', 'SA': 'ar', // Arabic regions
        'ET': 'am', // Amharic
        'MZ': 'pt', 'AO': 'pt', // Portuguese regions
      };

      return countryLanguageMap[country] || this.config.defaultLanguage;
    } catch {
      return this.config.defaultLanguage;
    }
  }

  private getStoredLanguage(): string | null {
    if (typeof window === 'undefined') return null;

    switch (this.config.persistence) {
      case 'localStorage':
        return localStorage.getItem('preferred-language');
      case 'sessionStorage':
        return sessionStorage.getItem('preferred-language');
      case 'cookie':
        return this.getCookie('preferred-language');
      default:
        return null;
    }
  }

  private setStoredLanguage(language: string): void {
    if (typeof window === 'undefined') return;

    switch (this.config.persistence) {
      case 'localStorage':
        localStorage.setItem('preferred-language', language);
        break;
      case 'sessionStorage':
        sessionStorage.setItem('preferred-language', language);
        break;
      case 'cookie':
        this.setCookie('preferred-language', language, 365);
        break;
    }
  }

  async setLanguage(languageCode: string): Promise<void> {
    const language = this.config.supportedLanguages.find(
      lang => lang.code === languageCode && lang.enabled
    );

    if (!language) {
      console.warn(`Language ${languageCode} not supported or disabled`);
      return;
    }

    await this.loadTranslations(languageCode);
    this.currentLanguage = languageCode;
    this.setStoredLanguage(languageCode);

    // Update HTML direction and lang attribute
    document.documentElement.setAttribute('lang', languageCode);
    document.documentElement.setAttribute('dir', language.direction);

    // Notify listeners
    this.listeners.forEach(listener => listener(languageCode));
  }

  private async loadTranslations(languageCode: string): Promise<void> {
    try {
      // In a real app, this would fetch from your translation API/CDN
      const translations = await import(`@/locales/${languageCode}.json`);
      this.translations.set(languageCode, translations.default);
    } catch (error) {
      console.warn(`Failed to load translations for ${languageCode}:`, error);
      
      // Fallback to default language
      if (languageCode !== this.config.fallbackLanguage) {
        await this.loadTranslations(this.config.fallbackLanguage);
      }
    }
  }

  t(key: string, namespace: string = 'common', params?: { [key: string]: any }): string {
    const translation = this.translations.get(this.currentLanguage);
    
    if (!translation) {
      console.warn(`No translations loaded for ${this.currentLanguage}`);
      return key;
    }

    // Navigate through namespace and key (e.g., 'auth.login.title')
    const keys = key.split('.');
    let value = translation[namespace];
    
    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      // Fallback to default language
      const fallbackTranslation = this.translations.get(this.config.fallbackLanguage);
      let fallbackValue = fallbackTranslation?.[namespace];
      
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
      }

      if (typeof fallbackValue === 'string') {
        value = fallbackValue;
      } else {
        console.warn(`Translation not found for key: ${namespace}.${key}`);
        return key;
      }
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value;
  }

  formatCurrency(amount: number, currency?: string): string {
    const regionalConfig = this.getRegionalConfig();
    const targetCurrency = currency || regionalConfig.currency;
    
    return new Intl.NumberFormat(this.getNumberFormat(), {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(date: Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
    const regionalConfig = this.getRegionalConfig();
    
    return new Intl.DateTimeFormat(this.currentLanguage, {
      dateStyle: style,
      timeZone: regionalConfig.timezone,
    }).format(date);
  }

  formatNumber(number: number): string {
    return new Intl.NumberFormat(this.getNumberFormat()).format(number);
  }

  private getNumberFormat(): string {
    const regionalConfig = this.getRegionalConfig();
    return regionalConfig.numberFormat || this.currentLanguage;
  }

  getRegionalConfig(): RegionalConfig {
    // In a real app, this would be based on user location or preference
    const userRegion = 'KE'; // This would come from user profile or geo-IP
    return this.regionalConfigs.get(userRegion) || this.regionalConfigs.get('KE')!;
  }

  getSupportedLanguages(): Language[] {
    return this.config.supportedLanguages.filter(lang => lang.enabled);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  subscribe(callback: (lang: string) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Utility methods
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift();
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
  }

  private loadLanguage(): void {
    const stored = this.getStoredLanguage();
    this.currentLanguage = stored || this.config.defaultLanguage;
  }
}

export const localizationService = new LocalizationService();
