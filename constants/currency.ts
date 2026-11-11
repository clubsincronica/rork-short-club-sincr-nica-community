/**
 * Formato de moneda de la temporada: pesos argentinos.
 * Los precios se guardan como número entero de pesos (sin centavos):
 * microCósmos = 40000, meditación = 12000, yoga = 20000.
 */

export const CURRENCY = '$';

export function formatPrice(value: number | string | undefined | null): string {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  const safe = Number.isFinite(parsed) ? Math.round(parsed) : 0;
  const sign = safe < 0 ? '-' : '';
  const digits = Math.abs(safe).toString();
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${CURRENCY}${withSeparators}`;
}
