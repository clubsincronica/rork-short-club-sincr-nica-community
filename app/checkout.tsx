import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Smartphone, DollarSign, Check, AlertCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useFoodCart } from '@/hooks/food-cart-store';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, createOrder } = useFoodCart();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'mobile' | 'mercadopago'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  if (!cart) {
    router.back();
    return null;
  }

  const deliveryFee = cart.orderType === 'delivery' ? 3.50 : 0;
  const tax = cartTotal * 0.10;
  const total = cartTotal + deliveryFee + tax;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const order = createOrder(paymentMethod);
      if (order) {
        // Navigate to order tracking
        router.replace(`/order-tracking/${order.id}`);
      }
      setIsProcessing(false);
    }, 2000);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen del pedido</Text>
          
          <View style={styles.summaryCard}>
            <Text style={styles.restaurantName}>{cart.provider.businessName}</Text>
            <Text style={styles.itemCount}>{cart.items.length} items</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
            </View>
            
            {cart.orderType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Envío</Text>
                <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Impuestos</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Método de pago</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionContent}>
              <CreditCard size={24} color={paymentMethod === 'card' ? Colors.gold : Colors.textLight} />
              <View style={styles.paymentOptionInfo}>
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'card' && styles.selectedPaymentText
                ]}>
                  Tarjeta de Crédito/Débito
                </Text>
                <Text style={styles.paymentOptionDescription}>
                  Pago seguro con tarjeta
                </Text>
              </View>
            </View>
            {paymentMethod === 'card' && (
              <Check size={20} color={Colors.gold} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'mobile' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('mobile')}
          >
            <View style={styles.paymentOptionContent}>
              <Smartphone size={24} color={paymentMethod === 'mobile' ? Colors.gold : Colors.textLight} />
              <View style={styles.paymentOptionInfo}>
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'mobile' && styles.selectedPaymentText
                ]}>
                  Pago Móvil
                </Text>
                <Text style={styles.paymentOptionDescription}>
                  PayPal, Apple Pay, Google Pay
                </Text>
              </View>
            </View>
            {paymentMethod === 'mobile' && (
              <Check size={20} color={Colors.gold} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'mercadopago' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('mercadopago')}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.mercadopagoIcon}>
                <Text style={styles.mercadopagoText}>MP</Text>
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'mercadopago' && styles.selectedPaymentText
                ]}>
                  MercadoPago
                </Text>
                <Text style={styles.paymentOptionDescription}>
                  Pago rápido y seguro
                </Text>
              </View>
            </View>
            {paymentMethod === 'mercadopago' && (
              <Check size={20} color={Colors.gold} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={styles.paymentOptionContent}>
              <DollarSign size={24} color={paymentMethod === 'cash' ? Colors.gold : Colors.textLight} />
              <View style={styles.paymentOptionInfo}>
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'cash' && styles.selectedPaymentText
                ]}>
                  Efectivo
                </Text>
                <Text style={styles.paymentOptionDescription}>
                  Pagar al recibir el pedido
                </Text>
              </View>
            </View>
            {paymentMethod === 'cash' && (
              <Check size={20} color={Colors.gold} />
            )}
          </TouchableOpacity>
        </View>

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <View style={styles.cardDetailsSection}>
            <Text style={styles.sectionTitle}>Detalles de la tarjeta</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de tarjeta</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.textLight}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre en la tarjeta</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Pérez"
                placeholderTextColor={Colors.textLight}
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Fecha de vencimiento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={Colors.textLight}
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={Colors.textLight}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.securityNote}>
              <AlertCircle size={16} color={Colors.textLight} />
              <Text style={styles.securityText}>
                Tu información de pago está encriptada y segura
              </Text>
            </View>
          </View>
        )}

        {/* Delivery Info */}
        {cart.orderType === 'delivery' && (
          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>Información de entrega</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>
                {cart.deliveryAddress || 'No especificada'}
              </Text>
              {cart.deliveryInstructions && (
                <>
                  <Text style={[styles.infoLabel, { marginTop: 8 }]}>Instrucciones</Text>
                  <Text style={styles.infoValue}>{cart.deliveryInstructions}</Text>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.payButton,
            isProcessing && styles.disabledButton
          ]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.payButtonText}>
              Pagar ${total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentSection: {
    padding: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPaymentOption: {
    borderColor: Colors.gold,
    backgroundColor: '#FFF8E1',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  selectedPaymentText: {
    color: Colors.text,
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  cardDetailsSection: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  deliverySection: {
    padding: 16,
    marginBottom: 100,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  payButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  mercadopagoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#009EE3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mercadopagoText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
});
