import { Linking, Alert } from 'react-native';

// MercadoPago configuration by country
export const MERCADOPAGO_CONFIG = {
  AR: {
    country: 'Argentina',
    currency: 'ARS',
    baseUrl: 'https://www.mercadopago.com.ar',
    symbol: '$',
  },
  BR: {
    country: 'Brazil',
    currency: 'BRL',
    baseUrl: 'https://www.mercadopago.com.br',
    symbol: 'R$',
  },
  UY: {
    country: 'Uruguay',
    currency: 'UYU',
    baseUrl: 'https://www.mercadopago.com.uy',
    symbol: '$U',
  },
  CL: {
    country: 'Chile',
    currency: 'CLP',
    baseUrl: 'https://www.mercadopago.cl',
    symbol: '$',
  },
  MX: {
    country: 'Mexico',
    currency: 'MXN',
    baseUrl: 'https://www.mercadopago.com.mx',
    symbol: '$',
  },
  CO: {
    country: 'Colombia',
    currency: 'COP',
    baseUrl: 'https://www.mercadopago.com.co',
    symbol: '$',
  },
  PE: {
    country: 'Peru',
    currency: 'PEN',
    baseUrl: 'https://www.mercadopago.com.pe',
    symbol: 'S/',
  },
};

export type MercadoPagoCountry = keyof typeof MERCADOPAGO_CONFIG;

interface PaymentPreference {
  title: string;
  description: string;
  amount: number;
  quantity?: number;
  userId: string;
  serviceId?: string;
  bookingId?: string;
}

export class MercadoPagoService {
  /**
   * Get MercadoPago configuration for a specific country
   */
  static getConfig(countryCode: string): typeof MERCADOPAGO_CONFIG.AR | null {
    const code = countryCode.toUpperCase() as MercadoPagoCountry;
    return MERCADOPAGO_CONFIG[code] || null;
  }

  /**
   * Check if MercadoPago is available in the country
   */
  static isAvailable(countryCode: string): boolean {
    return countryCode.toUpperCase() in MERCADOPAGO_CONFIG;
  }

  /**
   * Open MercadoPago payment in browser
   */
  static async openPayment(paymentUrl: string): Promise<void> {
    try {
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Error', 'No se pudo abrir el enlace de pago');
      }
    } catch (error) {
      console.error('Error opening MercadoPago payment:', error);
      Alert.alert('Error', 'No se pudo abrir el pago');
    }
  }

  /**
   * Handle MercadoPago deep link callback
   * URL format: clubsincronica://payment-success?payment_id=xxx&status=approved
   */
  static handlePaymentCallback(url: string): {
    status: 'success' | 'failure' | 'pending';
    paymentId?: string;
  } | null {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace('//', '');
      const params = new URLSearchParams(urlObj.search);

      if (path === 'payment-success') {
        return {
          status: 'success',
          paymentId: params.get('payment_id') || undefined,
        };
      } else if (path === 'payment-failed') {
        return {
          status: 'failure',
          paymentId: params.get('payment_id') || undefined,
        };
      } else if (path === 'payment-pending') {
        return {
          status: 'pending',
          paymentId: params.get('payment_id') || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing payment callback:', error);
      return null;
    }
  }

  /**
   * Format currency amount with proper symbol
   */
  static formatAmount(amount: number, countryCode: string): string {
    const config = this.getConfig(countryCode);
    if (!config) return `$${amount.toFixed(2)}`;

    return `${config.symbol}${amount.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

// Export helper functions
export const isMercadoPagoAvailable = MercadoPagoService.isAvailable;
export const formatMercadoPagoAmount = MercadoPagoService.formatAmount;
