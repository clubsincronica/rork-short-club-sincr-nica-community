/**
 * Platform fee constants — single source of truth for the frontend.
 *
 * IMPORTANT: PLATFORM_FEE_RATE must match the COMMISSION_RATE environment
 * variable configured on the backend (default: 0.05 = 5%).
 * If you change the backend rate, update this constant to match.
 */
export const PLATFORM_FEE_RATE = 0.05;

/**
 * Supported payment currencies.
 * ARS (Argentine Peso) is the platform default.
 * Users may change their preferred currency in Settings → Moneda.
 */
export const SUPPORTED_CURRENCIES = [
  'ARS', // Argentine Peso (default)
  'BRL', // Brazilian Real
  'UYU', // Uruguayan Peso
  'CLP', // Chilean Peso
  'MXN', // Mexican Peso
  'COP', // Colombian Peso
  'PEN', // Peruvian Sol
  'EUR', // Euro
  'USD', // US Dollar
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = 'ARS';

/** Human-readable labels for each currency */
export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  ARS: 'ARS — Peso Argentino',
  BRL: 'BRL — Real Brasileño',
  UYU: 'UYU — Peso Uruguayo',
  CLP: 'CLP — Peso Chileno',
  MXN: 'MXN — Peso Mexicano',
  COP: 'COP — Peso Colombiano',
  PEN: 'PEN — Sol Peruano',
  EUR: 'EUR — Euro',
  USD: 'USD — Dólar Estadounidense',
};

/** Currency symbols for display */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  ARS: '$',
  BRL: 'R$',
  UYU: '$U',
  CLP: '$',
  MXN: '$',
  COP: '$',
  PEN: 'S/',
  EUR: '€',
  USD: '$',
};
