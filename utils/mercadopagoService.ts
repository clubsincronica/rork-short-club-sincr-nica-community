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
  // App commission rate (2.5%)
  private static readonly COMMISSION_RATE = 0.025;

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
   * Calculate commission amount
   */
  static calculateCommission(amount: number): number {
    return Math.round(amount * this.COMMISSION_RATE * 100) / 100;
  }

  /**
   * Calculate provider's net amount (after commission)
   */
  static calculateProviderAmount(amount: number): number {
    return amount - this.calculateCommission(amount);
  }

  /**
   * Create a simple MercadoPago payment link (without backend)
   * This generates a basic payment link that the user can share
   */
  static async createSimplePaymentLink(
    preference: PaymentPreference,
    countryCode: string
  ): Promise<string | null> {
    const config = this.getConfig(countryCode);
    if (!config) {
      Alert.alert(
        'MercadoPago no disponible',
        `MercadoPago no está disponible en tu país. Por favor, contacta al proveedor del servicio.`
      );
      return null;
    }

    try {
      // For now, generate a payment link (requires backend for full implementation)
      // This is a placeholder - actual implementation needs MercadoPago SDK + backend
      
      console.log('Creating MercadoPago payment:', {
        ...preference,
        currency: config.currency,
        commission: this.calculateCommission(preference.amount),
        providerAmount: this.calculateProviderAmount(preference.amount),
      });

      // TODO: When backend is ready, call:
      // const response = await fetch(`${API_URL}/create-mercadopago-payment`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...preference,
      //     currency: config.currency,
      //     marketplace_fee: this.calculateCommission(preference.amount),
      //   })
      // });
      // const { init_point } = await response.json();
      // return init_point;

      // For now, show info to user
      Alert.alert(
        'Pago con MercadoPago',
        `Para completar el pago:\n\n` +
        `💰 Monto: ${config.symbol}${preference.amount}\n` +
        `💼 Comisión (2.5%): ${config.symbol}${this.calculateCommission(preference.amount)}\n` +
        `✅ El proveedor recibirá: ${config.symbol}${this.calculateProviderAmount(preference.amount)}\n\n` +
        `Próximamente podrás pagar directamente con MercadoPago en la app.`,
        [{ text: 'Entendido' }]
      );

      return null;
    } catch (error) {
      console.error('Error creating MercadoPago payment:', error);
      Alert.alert(
        'Error',
        'No se pudo crear el pago. Por favor, intenta nuevamente.'
      );
      return null;
    }
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
export const createMercadoPagoPayment = MercadoPagoService.createSimplePaymentLink;
export const formatMercadoPagoAmount = MercadoPagoService.formatAmount;
export const calculateCommission = MercadoPagoService.calculateCommission;
