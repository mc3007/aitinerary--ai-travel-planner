/**
 * Currency detection and conversion service.
 * Uses free APIs for live exchange rates.
 */

import { CURRENCIES } from '../types/itinerary';

// Country-to-currency mapping for common destinations
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  AF: 'AFN', AL: 'ALL', DZ: 'DZD', AR: 'ARS', AM: 'AMD', AU: 'AUD', AT: 'EUR',
  AZ: 'AZN', BH: 'BHD', BD: 'BDT', BY: 'BYN', BE: 'EUR', BO: 'BOB', BA: 'BAM',
  BW: 'BWP', BR: 'BRL', BG: 'BGN', KH: 'KHR', CM: 'XAF', CA: 'CAD', CL: 'CLP',
  CN: 'CNY', CO: 'COP', CR: 'CRC', HR: 'EUR', CU: 'CUP', CY: 'EUR', CZ: 'CZK',
  DK: 'DKK', DO: 'DOP', EC: 'USD', EG: 'EGP', SV: 'USD', EE: 'EUR', ET: 'ETB',
  FI: 'EUR', FR: 'EUR', GE: 'GEL', DE: 'EUR', GH: 'GHS', GR: 'EUR', GT: 'GTQ',
  HK: 'HKD', HU: 'HUF', IS: 'ISK', IN: 'INR', ID: 'IDR', IR: 'IRR', IQ: 'IQD',
  IE: 'EUR', IL: 'ILS', IT: 'EUR', JM: 'JMD', JP: 'JPY', JO: 'JOD', KZ: 'KZT',
  KE: 'KES', KR: 'KRW', KW: 'KWD', KG: 'KGS', LA: 'LAK', LV: 'EUR', LB: 'LBP',
  LY: 'LYD', LT: 'EUR', LU: 'EUR', MO: 'MOP', MY: 'MYR', MV: 'MVR', MT: 'EUR',
  MX: 'MXN', MD: 'MDL', MN: 'MNT', ME: 'EUR', MA: 'MAD', MM: 'MMK', NP: 'NPR',
  NL: 'EUR', NZ: 'NZD', NI: 'NIO', NG: 'NGN', KP: 'KPW', MK: 'MKD', NO: 'NOK',
  OM: 'OMR', PK: 'PKR', PA: 'PAB', PY: 'PYG', PE: 'PEN', PH: 'PHP', PL: 'PLN',
  PT: 'EUR', QA: 'QAR', RO: 'RON', RU: 'RUB', RW: 'RWF', SA: 'SAR', RS: 'RSD',
  SG: 'SGD', SK: 'EUR', SI: 'EUR', ZA: 'ZAR', ES: 'EUR', LK: 'LKR', SD: 'SDG',
  SE: 'SEK', CH: 'CHF', TW: 'TWD', TZ: 'TZS', TH: 'THB', TN: 'TND', TR: 'TRY',
  TM: 'TMT', UG: 'UGX', UA: 'UAH', AE: 'AED', GB: 'GBP', US: 'USD', UY: 'UYU',
  UZ: 'UZS', VE: 'VES', VN: 'VND', YE: 'YER', ZM: 'ZMW', ZW: 'ZWL',
};

// City name to country code for well-known destinations
const CITY_COUNTRY_MAP: Record<string, string> = {
  'tokyo': 'JP', 'kyoto': 'JP', 'osaka': 'JP', 'hiroshima': 'JP',
  'paris': 'FR', 'nice': 'FR', 'lyon': 'FR', 'marseille': 'FR',
  'london': 'GB', 'manchester': 'GB', 'edinburgh': 'GB', 'liverpool': 'GB',
  'new york': 'US', 'los angeles': 'US', 'chicago': 'US', 'san francisco': 'US', 'miami': 'US', 'las vegas': 'US',
  'bangkok': 'TH', 'phuket': 'TH', 'chiang mai': 'TH',
  'bali': 'ID', 'jakarta': 'ID',
  'sydney': 'AU', 'melbourne': 'AU', 'brisbane': 'AU',
  'dubai': 'AE', 'abu dhabi': 'AE',
  'singapore': 'SG',
  'hong kong': 'HK',
  'seoul': 'KR', 'busan': 'KR',
  'barcelona': 'ES', 'madrid': 'ES', 'seville': 'ES',
  'rome': 'IT', 'milan': 'IT', 'venice': 'IT', 'florence': 'IT',
  'berlin': 'DE', 'munich': 'DE', 'frankfurt': 'DE',
  'amsterdam': 'NL',
  'prague': 'CZ',
  'vienna': 'AT',
  'budapest': 'HU',
  'lisbon': 'PT', 'porto': 'PT',
  'dublin': 'IE',
  'copenhagen': 'DK',
  'stockholm': 'SE',
  'oslo': 'NO',
  'helsinki': 'FI',
  'warsaw': 'PL',
  'istanbul': 'TR',
  'moscow': 'RU',
  'cairo': 'EG',
  'cape town': 'ZA', 'johannesburg': 'ZA',
  'nairobi': 'KE',
  'marrakech': 'MA',
  'mexico city': 'MX', 'cancun': 'MX',
  'rio de janeiro': 'BR', 'sao paulo': 'BR',
  'buenos aires': 'AR',
  'santiago': 'CL',
  'lima': 'PE',
  'bogota': 'CO',
  'toronto': 'CA', 'vancouver': 'CA', 'montreal': 'CA',
  'delhi': 'IN', 'mumbai': 'IN', 'goa': 'IN', 'jaipur': 'IN', 'agra': 'IN',
};

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

let cachedRates: ExchangeRates | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get exchange rates (cached for 30 minutes).
 * Uses the free open.er-api.com which updates daily.
 */
export async function getExchangeRates(
  base: string = 'USD'
): Promise<ExchangeRates> {
  if (
    cachedRates &&
    cachedRates.base === base &&
    Date.now() - cachedRates.timestamp < CACHE_DURATION
  ) {
    return cachedRates;
  }

  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${base}`
    );
    if (!response.ok) throw new Error('Failed to fetch rates');

    const data = await response.json();
    cachedRates = {
      base: data.base_code,
      rates: data.rates,
      timestamp: Date.now(),
    };
    return cachedRates;
  } catch {
    // Return stale cache if available, otherwise throw
    if (cachedRates) return cachedRates;
    throw new Error('Exchange rate service unavailable');
  }
}

/**
 * Detect the currency for a given country code.
 */
export function getCurrencyForCountry(countryCode: string): CurrencyInfo | null {
  const code = COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()];
  if (!code) return null;
  return CURRENCIES.find((c) => c.code === code) ?? null;
}

/**
 * Detect the currency for a given destination name.
 * First tries the city map, then falls back to common patterns.
 */
export function detectCurrencyFromDestination(destination: string): CurrencyInfo | null {
  const normalized = destination.trim().toLowerCase();

  // Check city map first
  const countryCode = CITY_COUNTRY_MAP[normalized];
  if (countryCode) {
    return getCurrencyForCountry(countryCode);
  }

  // Try partial match on city names
  for (const [city, cc] of Object.entries(CITY_COUNTRY_MAP)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return getCurrencyForCountry(cc);
    }
  }

  return null;
}

/**
 * Detect the user's home currency from browser locale.
 */
export function detectHomeCurrency(): string {
  try {
    // Try to get from browser
    const locale = navigator.language || 'en-US';
    // Map common locales to currencies
    const localeCurrencyMap: Record<string, string> = {
      'en-US': 'USD', 'en-GB': 'GBP', 'en-CA': 'CAD', 'en-AU': 'AUD',
      'en-IN': 'INR', 'en-SG': 'SGD', 'en-NZ': 'NZD',
      'fr-FR': 'EUR', 'fr-CA': 'CAD',
      'de-DE': 'EUR', 'de-AT': 'EUR', 'de-CH': 'CHF',
      'es-ES': 'EUR', 'es-MX': 'MXN', 'es-AR': 'ARS',
      'it-IT': 'EUR',
      'pt-BR': 'BRL', 'pt-PT': 'EUR',
      'ja-JP': 'JPY',
      'ko-KR': 'KRW',
      'zh-CN': 'CNY', 'zh-TW': 'TWD', 'zh-HK': 'HKD',
      'nl-NL': 'EUR',
      'pl-PL': 'PLN',
      'ru-RU': 'RUB',
      'tr-TR': 'TRY',
      'ar-SA': 'SAR', 'ar-AE': 'AED',
      'th-TH': 'THB',
      'vi-VN': 'VND',
      'id-ID': 'IDR',
      'ms-MY': 'MYR',
      'fil-PH': 'PHP',
    };
    return localeCurrencyMap[locale] || 'USD';
  } catch {
    return 'USD';
  }
}

/**
 * Convert an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;

  // Convert to base first, then to target
  const amountInBase = fromCurrency === rates.base
    ? amount
    : amount / (rates.rates[fromCurrency] || 1);

  return amountInBase * (rates.rates[toCurrency] || 1);
}

/**
 * Get the currency symbol for a currency code.
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export const DISCLAIMER_TEXT =
  'Currency conversions and fare estimates are approximate based on recent data. Actual rates may vary at the time of travel.';