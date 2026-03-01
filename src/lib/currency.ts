export type SupportedCurrency = "KES" | "NGN" | "GHS" | "UGX" | "TZS" | "RWF" | "ETB" | "ZAR" | "XOF" | "XAF" | "USD";

export interface CurrencyInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", decimals: 0 },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", decimals: 0 },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭", decimals: 2 },
  UGX: { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬", decimals: 0 },
  TZS: { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿", decimals: 0 },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "FRw", flag: "🇷🇼", decimals: 0 },
  ETB: { code: "ETB", name: "Ethiopian Birr", symbol: "Br", flag: "🇪🇹", decimals: 2 },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", decimals: 2 },
  XOF: { code: "XOF", name: "West African CFA", symbol: "CFA", flag: "🌍", decimals: 0 },
  XAF: { code: "XAF", name: "Central African CFA", symbol: "FCFA", flag: "🌍", decimals: 0 },
  USD: { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", decimals: 2 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

/**
 * Detect default currency from browser locale/timezone
 */
export function detectCurrencyFromLocale(): SupportedCurrency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzLower = tz.toLowerCase();
    
    if (tzLower.includes("nairobi")) return "KES";
    if (tzLower.includes("lagos")) return "NGN";
    if (tzLower.includes("accra")) return "GHS";
    if (tzLower.includes("kampala")) return "UGX";
    if (tzLower.includes("dar_es_salaam")) return "TZS";
    if (tzLower.includes("kigali")) return "RWF";
    if (tzLower.includes("addis_ababa")) return "ETB";
    if (tzLower.includes("johannesburg")) return "ZAR";
    if (tzLower.includes("dakar") || tzLower.includes("abidjan")) return "XOF";
    if (tzLower.includes("douala") || tzLower.includes("libreville")) return "XAF";
  } catch {
    // Fall through
  }
  return "KES"; // Default
}

/**
 * Convert a USD amount to a target currency using a rate.
 * All internal values are stored in USD (base currency).
 */
export function convertFromUSD(amountUSD: number, rate: number): number {
  return amountUSD * rate;
}

/**
 * Convert a local currency amount back to USD.
 */
export function convertToUSD(amountLocal: number, rate: number): number {
  if (rate === 0) return 0;
  return amountLocal / rate;
}

/**
 * Format a monetary value with the correct currency symbol and decimals.
 * This is the ONLY function that should be used to display currency values.
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  options?: { compact?: boolean; showCode?: boolean }
): string {
  const info = CURRENCIES[currency];
  if (!info) return `${amount}`;

  const decimals = info.decimals;
  let formatted: string;

  if (options?.compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1_000_000) {
      formatted = (amount / 1_000_000).toFixed(1) + "M";
    } else if (Math.abs(amount) >= 1_000) {
      formatted = (amount / 1_000).toFixed(1) + "K";
    } else {
      formatted = amount.toFixed(decimals);
    }
  } else {
    formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  if (options?.showCode) {
    return `${info.symbol} ${formatted} ${currency}`;
  }
  return `${info.symbol} ${formatted}`;
}

/**
 * Format BAKCoins - these are NOT converted, just displayed as BAK
 */
export function formatBAK(amount: number, decimals = 2): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals })} BAK`;
}
