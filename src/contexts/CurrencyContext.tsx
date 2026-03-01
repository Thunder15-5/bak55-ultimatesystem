import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  SupportedCurrency,
  CURRENCIES,
  CurrencyInfo,
  detectCurrencyFromLocale,
  convertFromUSD,
  formatCurrency as formatCurrencyUtil,
  formatBAK,
} from "@/lib/currency";

interface ExchangeRates {
  [currency: string]: number;
}

interface CurrencyContextType {
  currency: SupportedCurrency;
  currencyInfo: CurrencyInfo;
  rates: ExchangeRates;
  ratesLoaded: boolean;
  setCurrency: (currency: SupportedCurrency) => void;
  /** Convert a USD base amount to the user's display currency */
  convert: (amountUSD: number) => number;
  /** Convert a KES amount to the user's display currency (legacy helper for existing KES-denominated data) */
  convertFromKES: (amountKES: number) => number;
  /** Format a USD base amount in the user's display currency */
  formatAmount: (amountUSD: number, options?: { compact?: boolean; showCode?: boolean }) => string;
  /** Format a KES amount in the user's display currency (legacy helper) */
  formatFromKES: (amountKES: number, options?: { compact?: boolean; showCode?: boolean }) => string;
  /** Format BAKCoins (no conversion) */
  formatBAK: (amount: number, decimals?: number) => string;
  /** Whether admin is viewing in base currency mode */
  showBaseCurrency: boolean;
  setShowBaseCurrency: (show: boolean) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    // Check localStorage first, then detect
    const saved = localStorage.getItem("preferred_currency");
    if (saved && saved in CURRENCIES) return saved as SupportedCurrency;
    return detectCurrencyFromLocale();
  });
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1, KES: 129.5 });
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [showBaseCurrency, setShowBaseCurrency] = useState(false);

  // Load exchange rates from database
  useEffect(() => {
    const loadRates = async () => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select("target_currency, rate");

      if (!error && data) {
        const rateMap: ExchangeRates = {};
        data.forEach((r: any) => {
          rateMap[r.target_currency] = Number(r.rate);
        });
        setRates(rateMap);
        setRatesLoaded(true);
      }
    };
    loadRates();
  }, []);

  // Load user's preferred currency from profile
  useEffect(() => {
    if (!user) return;
    const loadPreference = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.preferred_currency && data.preferred_currency in CURRENCIES) {
        setCurrencyState(data.preferred_currency as SupportedCurrency);
        localStorage.setItem("preferred_currency", data.preferred_currency);
      }
    };
    loadPreference();
  }, [user]);

  const setCurrency = useCallback(
    async (newCurrency: SupportedCurrency) => {
      setCurrencyState(newCurrency);
      localStorage.setItem("preferred_currency", newCurrency);

      // Save to profile if logged in
      if (user) {
        await supabase
          .from("profiles")
          .update({ preferred_currency: newCurrency })
          .eq("id", user.id);
      }
    },
    [user]
  );

  const activeCurrency = showBaseCurrency ? "USD" : currency;
  const currencyInfo = CURRENCIES[activeCurrency];

  const convert = useCallback(
    (amountUSD: number): number => {
      const rate = rates[activeCurrency] || 1;
      return convertFromUSD(amountUSD, rate);
    },
    [activeCurrency, rates]
  );

  // Legacy helper: convert KES amounts (existing data) to user's currency
  const convertFromKES = useCallback(
    (amountKES: number): number => {
      if (activeCurrency === "KES") return amountKES;
      const kesRate = rates["KES"] || 129.5;
      const amountUSD = amountKES / kesRate;
      const targetRate = rates[activeCurrency] || 1;
      return amountUSD * targetRate;
    },
    [activeCurrency, rates]
  );

  const formatAmount = useCallback(
    (amountUSD: number, options?: { compact?: boolean; showCode?: boolean }): string => {
      const converted = convert(amountUSD);
      return formatCurrencyUtil(converted, activeCurrency, options);
    },
    [convert, activeCurrency]
  );

  const formatFromKES = useCallback(
    (amountKES: number, options?: { compact?: boolean; showCode?: boolean }): string => {
      const converted = convertFromKES(amountKES);
      return formatCurrencyUtil(converted, activeCurrency, options);
    },
    [convertFromKES, activeCurrency]
  );

  const value = useMemo(
    () => ({
      currency: activeCurrency,
      currencyInfo,
      rates,
      ratesLoaded,
      setCurrency,
      convert,
      convertFromKES,
      formatAmount,
      formatFromKES,
      formatBAK,
      showBaseCurrency,
      setShowBaseCurrency,
    }),
    [activeCurrency, currencyInfo, rates, ratesLoaded, setCurrency, convert, convertFromKES, formatAmount, formatFromKES, showBaseCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
