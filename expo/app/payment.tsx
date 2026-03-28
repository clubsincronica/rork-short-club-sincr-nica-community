import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CreditCard,
  Plus,
  Trash2,
  Shield,
  Lock,
  Check,
  ChevronLeft,
  Edit3,
  Star,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

type PaymentMethod = {
  id: string;
  type: 'card' | 'paypal' | 'apple-pay' | 'mercadopago';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
  email?: string;
};

type BookingItem = {
  id: string;
  title: string;
  provider: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  price: number;
  image: string;
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      nickname: 'Tarjeta Principal',
    },
    {
      id: '2',
      type: 'card',
      last4: '5555',
      brand: 'Mastercard',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
      nickname: 'Tarjeta de Trabajo',
    },
    {
      id: '3',
      type: 'mercadopago',
      isDefault: false,
      nickname: 'MercadoPago',
      email: 'usuario@email.com',
    },
  ]);

  const [bookingItems] = useState<BookingItem[]>([
    {
      id: '1',
      title: 'Sesión de Reiki Sanador',
      provider: 'María González',
      date: '15 de Marzo',
      time: '10:00',
      duration: '60 min',
      location: 'Centro Holístico Luz',
      price: 65,
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    },
    {
      id: '2',
      title: 'Clase de Yoga Vinyasa',
      provider: 'Carlos Mendoza',
      date: '16 de Marzo',
      time: '18:30',
      duration: '90 min',
      location: 'Estudio Namaste',
      price: 25,
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    },
  ]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [savePaymentInfo, setSavePaymentInfo] = useState<boolean>(true);
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    nickname: '',
  });

  const subtotal = bookingItems.reduce((sum, item) => sum + item.price, 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const handlePayment = () => {
    Alert.alert(
      'Confirmar Pago',
      `Total: €${total}\n¿Proceder con el pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: () => {
            Alert.alert('¡Pago Exitoso!', 'Tus reservas han sido confirmadas. Te enviaremos los detalles por email.');
            router.back();
          },
        },
      ]
    );
  };

  const handleAddCard = () => {
    if (!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    const newPaymentMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      last4: newCard.number.slice(-4),
      brand: newCard.number.startsWith('4') ? 'Visa' : 'Mastercard',
      expiryMonth: parseInt(newCard.expiry.split('/')[0]),
      expiryYear: parseInt('20' + newCard.expiry.split('/')[1]),
      isDefault: paymentMethods.length === 0,
      nickname: newCard.nickname || 'Nueva Tarjeta',
    };

    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setNewCard({ number: '', expiry: '', cvv: '', name: '', nickname: '' });
    setIsAddingCard(false);
    Alert.alert('Éxito', 'Tarjeta añadida correctamente.');
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Eliminar Tarjeta',
      '¿Estás seguro de que quieres eliminar esta tarjeta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(pm => pm.id !== cardId));
          },
        },
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isSelected = selectedPaymentMethod === method.id;
    
    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardSelected]}
        onPress={() => setSelectedPaymentMethod(method.id)}
      >
        <View style={styles.paymentMethodLeft}>
          <View style={[styles.cardIcon, method.type === 'mercadopago' && styles.mercadopagoIcon]}>
            {method.type === 'mercadopago' ? (
              <Text style={styles.mercadopagoText}>MP</Text>
            ) : (
              <CreditCard size={20} color={Colors.primary} />
            )}
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodTitle}>{method.nickname}</Text>
            {method.type === 'mercadopago' ? (
              <Text style={styles.paymentMethodDetails}>
                {method.email}
              </Text>
            ) : (
              <>
                <Text style={styles.paymentMethodDetails}>
                  {method.brand} •••• {method.last4}
                </Text>
                <Text style={styles.paymentMethodExpiry}>
                  Expira {method.expiryMonth}/{method.expiryYear}
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.paymentMethodRight}>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Principal</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCard(method.id)}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Check size={16} color={Colors.white} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Pago',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Booking Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen de Reservas</Text>
            {bookingItems.map((item) => (
              <View key={item.id} style={styles.bookingCard}>
                <Image source={{ uri: item.image }} style={styles.bookingImage} />
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>{item.title}</Text>
                  <Text style={styles.bookingProvider}>con {item.provider}</Text>
                  <View style={styles.bookingDetails}>
                    <View style={styles.bookingDetail}>
                      <Calendar size={12} color={Colors.textLight} />
                      <Text style={styles.bookingDetailText}>{item.date}</Text>
                    </View>
                    <View style={styles.bookingDetail}>
                      <Clock size={12} color={Colors.textLight} />
                      <Text style={styles.bookingDetailText}>{item.time} • {item.duration}</Text>
                    </View>
                    <View style={styles.bookingDetail}>
                      <MapPin size={12} color={Colors.textLight} />
                      <Text style={styles.bookingDetailText}>{item.location}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.bookingPrice}>
                  <Text style={styles.bookingPriceText}>€{item.price}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Métodos de Pago</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddingCard(true)}
              >
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addButtonText}>Añadir</Text>
              </TouchableOpacity>
            </View>
            
            {paymentMethods.map(renderPaymentMethod)}

            {/* Add MercadoPago Option */}
            <TouchableOpacity
              style={styles.addMercadopagoButton}
              onPress={() => {
                const newMercadoPago: PaymentMethod = {
                  id: Date.now().toString(),
                  type: 'mercadopago',
                  isDefault: paymentMethods.length === 0,
                  nickname: 'MercadoPago',
                  email: 'usuario@email.com',
                };
                setPaymentMethods([...paymentMethods, newMercadoPago]);
                Alert.alert('Éxito', 'MercadoPago añadido correctamente.');
              }}
            >
              <View style={styles.mercadopagoIconSmall}>
                <Text style={styles.mercadopagoText}>MP</Text>
              </View>
              <Text style={styles.addMercadopagoText}>Añadir MercadoPago</Text>
            </TouchableOpacity>

            {isAddingCard && (
              <View style={styles.addCardForm}>
                <Text style={styles.addCardTitle}>Añadir Nueva Tarjeta</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Número de Tarjeta</Text>
                  <TextInput
                    style={styles.input}
                    value={newCard.number}
                    onChangeText={(text) => setNewCard({ ...newCard, number: text })}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.inputLabel}>Fecha Exp.</Text>
                    <TextInput
                      style={styles.input}
                      value={newCard.expiry}
                      onChangeText={(text) => setNewCard({ ...newCard, expiry: text })}
                      placeholder="MM/AA"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={newCard.cvv}
                      onChangeText={(text) => setNewCard({ ...newCard, cvv: text })}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre en la Tarjeta</Text>
                  <TextInput
                    style={styles.input}
                    value={newCard.name}
                    onChangeText={(text) => setNewCard({ ...newCard, name: text })}
                    placeholder="Juan Pérez"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Apodo (Opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newCard.nickname}
                    onChangeText={(text) => setNewCard({ ...newCard, nickname: text })}
                    placeholder="Mi tarjeta personal"
                  />
                </View>

                <View style={styles.addCardActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsAddingCard(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveCardButton}
                    onPress={handleAddCard}
                  >
                    <Text style={styles.saveCardButtonText}>Guardar Tarjeta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desglose de Precios</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>€{subtotal}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Comisión de servicio</Text>
                <Text style={styles.priceValue}>€{serviceFee}</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>€{total}</Text>
              </View>
            </View>
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Shield size={16} color={Colors.success} />
            <Text style={styles.securityText}>
              Tus datos de pago están protegidos con encriptación de nivel bancario
            </Text>
          </View>

          {/* Save Payment Info Toggle */}
          <View style={styles.savePaymentToggle}>
            <View style={styles.savePaymentLeft}>
              <Lock size={16} color={Colors.primary} />
              <Text style={styles.savePaymentLabel}>Guardar información de pago</Text>
            </View>
            <Switch
              value={savePaymentInfo}
              onValueChange={setSavePaymentInfo}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </ScrollView>

        {/* Payment Button */}
        <View style={styles.paymentFooter}>
          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <Lock size={20} color={Colors.white} />
            <Text style={styles.paymentButtonText}>Pagar €{total}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bookingProvider: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  bookingDetails: {
    gap: 4,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  bookingPrice: {
    justifyContent: 'center',
  },
  bookingPriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: Colors.textLight,
  },
  paymentMethodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteButton: {
    padding: 4,
  },
  selectedIndicator: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  addCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  addCardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  saveCardButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveCardButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
  priceBreakdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: Colors.textLight,
  },
  priceValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  savePaymentToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  savePaymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  savePaymentLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  paymentFooter: {
    backgroundColor: Colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  mercadopagoIcon: {
    backgroundColor: '#009EE3',
  },
  addMercadopagoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mercadopagoIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#009EE3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mercadopagoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  addMercadopagoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});