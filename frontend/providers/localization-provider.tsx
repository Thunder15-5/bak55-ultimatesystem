// frontend/providers/localization-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { localizationService } from '@/services/localization-service';
import { Language } from '@/types/localization';

interface LocalizationContextType {
  currentLanguage: string;
  supportedLanguages: Language[];
  t: (key: string, namespace?: string, params?: { [key: string]: any }) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date, style?: 'short' | 'medium' | 'long') => string;
  formatNumber: (number: number) => string;
  setLanguage: (languageCode: string) => Promise<void>;
  isLoading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      await localizationService.initialize();
      
      setCurrentLanguage(localizationService.getCurrentLanguage());
      setSupportedLanguages(localizationService.getSupportedLanguages());
      setIsLoading(false);
    }

    initialize();

    // Subscribe to language changes
    const unsubscribe = localizationService.subscribe((lang) => {
      setCurrentLanguage(lang);
    });

    return unsubscribe;
  }, []);

  const value: LocalizationContextType = {
    currentLanguage,
    supportedLanguages,
    t: localizationService.t.bind(localizationService),
    formatCurrency: localizationService.formatCurrency.bind(localizationService),
    formatDate: localizationService.formatDate.bind(localizationService),
    formatNumber: localizationService.formatNumber.bind(localizationService),
    setLanguage: localizationService.setLanguage.bind(localizationService),
    isLoading,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

// Higher-order component for class components
export function withLocalization<P>(WrappedComponent: React.ComponentType<P>) {
  return function LocalizedComponent(props: P) {
    const localization = useLocalization();
    return <WrappedComponent {...props} localization={localization} />;
  };
}
