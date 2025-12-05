import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  Plus,
  Trash2,
  ChevronLeft,
  Check,
  X,
} from '../components/SmartIcons';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/hooks/user-store';

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paymentMethods, addPaymentMethod, removePaymentMethod } = useUser();
  
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [addingType, setAddingType] = useState<'card' | 'mercadopago' | 'bizum' | null>(null);
  
  // Form states
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    nickname: '',
  });
  
  const [mercadopagoForm, setMercadopagoForm] = useState({
    email: '',
    nickname: '',
  });
  
  const [bizumForm, setBizumForm] = useState({
    phone: '',
    nickname: '',
  });

  const resetForms = () => {
    setCardForm({ number: '', expiry: '', cvv: '', name: '', nickname: '' });
    setMercadopagoForm({ email: '', nickname: '' });
    setBizumForm({ phone: '', nickname: '' });
  };

  const handleAddCard = () => {
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    const newMethod = {
      type: 'card' as const,
      last4: cardForm.number.slice(-4),
      brand: cardForm.number.startsWith('4') ? 'Visa' : 'Mastercard',
      expiryMonth: parseInt(cardForm.expiry.split('/')[0]),
      expiryYear: parseInt('20' + cardForm.expiry.split('/')[1]),
      isDefault: paymentMethods.length === 0,
      nickname: cardForm.nickname || 'Nueva Tarjeta',
    };

    addPaymentMethod(newMethod);
    resetForms();
    setIsAddingMethod(false);
    setAddingType(null);
    Alert.alert('Éxito', 'Tarjeta añadida correctamente.');
  };

  const handleAddMercadoPago = () => {
    if (!mercadopagoForm.email) {
      Alert.alert('Error', 'Por favor ingresa tu email de MercadoPago.');
      return;
    }

    const newMethod = {
      type: 'mercadopago' as const,
      email: mercadopagoForm.email,
      isDefault: paymentMethods.length === 0,
      nickname: mercadopagoForm.nickname || 'Mi MercadoPago',
    };

    addPaymentMethod(newMethod);
    resetForms();
    setIsAddingMethod(false);
    setAddingType(null);
    Alert.alert('Éxito', 'Cuenta de MercadoPago añadida correctamente.');
  };

  const handleAddBizum = () => {
    if (!bizumForm.phone) {
      Alert.alert('Error', 'Por favor ingresa tu número de teléfono.');
      return;
    }

    const newMethod = {
      type: 'bizum' as const,
      phone: bizumForm.phone,
      isDefault: paymentMethods.length === 0,
      nickname: bizumForm.nickname || 'Mi Bizum',
    };

    addPaymentMethod(newMethod);
    resetForms();
    setIsAddingMethod(false);
    setAddingType(null);
    Alert.alert('Éxito', 'Bizum añadido correctamente.');
  };

  const handleDeletePaymentMethod = (id: string) => {
    Alert.alert(
      'Eliminar Método de Pago',
      '¿Estás seguro de que quieres eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removePaymentMethod(id),
        },
      ]
    );
  };

  const getPaymentMethodIcon = (method: any) => {
    switch (method.type) {
      case 'card':
        return <CreditCard color={Colors.primary} size={24} />;
      case 'mercadopago':
        return (
          <View style={styles.mercadopagoIcon}>
            <Text style={styles.mercadopagoText}>MP</Text>
          </View>
        );
      case 'bizum':
        return (
          <View style={styles.bizumIcon}>
            <Text style={styles.bizumText}>B</Text>
          </View>
        );
      default:
        return <CreditCard color={Colors.primary} size={24} />;
    }
  };

  const getPaymentMethodTitle = (method: any) => {
    switch (method.type) {
      case 'card':
        return `${method.brand} •••• ${method.last4}`;
      case 'mercadopago':
        return method.email;
      case 'bizum':
        return method.phone;
      default:
        return 'Método de Pago';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Methods List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus Métodos de Pago</Text>
          
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCard color={Colors.textSecondary} size={48} />
              <Text style={styles.emptyStateText}>No tienes métodos de pago guardados</Text>
              <Text style={styles.emptyStateSubtext}>
                Añade tu primera tarjeta o cuenta para pagar más rápido
              </Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentMethodCard}>
                <View style={styles.paymentMethodInfo}>
                  {getPaymentMethodIcon(method)}
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodTitle}>
                      {getPaymentMethodTitle(method)}
                    </Text>
                    <Text style={styles.paymentMethodSubtitle}>
                      {method.nickname}
                      {method.isDefault && ' • Por defecto'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeletePaymentMethod(method.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 color={Colors.error} size={20} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Add Payment Method Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingMethod(true)}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.addButtonGradient}
          >
            <Plus color={Colors.white} size={24} />
            <Text style={styles.addButtonText}>Añadir Método de Pago</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={isAddingMethod}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setIsAddingMethod(false);
                setAddingType(null);
                resetForms();
              }}
              style={styles.modalCloseButton}
            >
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {addingType ? 'Añadir Método de Pago' : 'Seleccionar Tipo'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {!addingType ? (
              // Payment Type Selection
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>¿Qué método quieres añadir?</Text>
                
                <TouchableOpacity
                  style={styles.paymentTypeButton}
                  onPress={() => setAddingType('card')}
                >
                  <CreditCard color={Colors.primary} size={24} />
                  <Text style={styles.paymentTypeText}>Tarjeta de Crédito/Débito</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.paymentTypeButton}
                  onPress={() => setAddingType('mercadopago')}
                >
                  <View style={styles.mercadopagoIcon}>
                    <Text style={styles.mercadopagoText}>MP</Text>
                  </View>
                  <Text style={styles.paymentTypeText}>MercadoPago</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.paymentTypeButton}
                  onPress={() => setAddingType('bizum')}
                >
                  <View style={styles.bizumIcon}>
                    <Text style={styles.bizumText}>B</Text>
                  </View>
                  <Text style={styles.paymentTypeText}>Bizum</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Payment Method Forms
              <View style={styles.section}>
                {addingType === 'card' && (
                  <View>
                    <Text style={styles.sectionTitle}>Añadir Tarjeta</Text>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Número de tarjeta *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1234 5678 9012 3456"
                        value={cardForm.number}
                        onChangeText={(text: string) => setCardForm({ ...cardForm, number: text })}
                        keyboardType="numeric"
                        maxLength={19}
                      />
                    </View>
                    
                    <View style={styles.inputRow}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Vencimiento *</Text>
                        <TextInput
                          style={[styles.input, { flex: 1, marginRight: 10 }]}
                          placeholder="MM/AA"
                          value={cardForm.expiry}
                          onChangeText={(text: string) => setCardForm({ ...cardForm, expiry: text })}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>CVV *</Text>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="123"
                          value={cardForm.cvv}
                          onChangeText={(text: string) => setCardForm({ ...cardForm, cvv: text })}
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nombre del titular *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Como aparece en la tarjeta"
                        value={cardForm.name}
                        onChangeText={(text: string) => setCardForm({ ...cardForm, name: text })}
                        autoCapitalize="words"
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nombre para identificar (opcional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Mi Tarjeta Principal"
                        value={cardForm.nickname}
                        onChangeText={(text: string) => setCardForm({ ...cardForm, nickname: text })}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.saveButton, (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) && styles.saveButtonDisabled]}
                      onPress={handleAddCard}
                      disabled={!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name}
                    >
                      <Text style={[styles.saveButtonText, (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) && styles.saveButtonTextDisabled]}>
                        Guardar Tarjeta
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {addingType === 'mercadopago' && (
                  <View>
                    <Text style={styles.sectionTitle}>Conectar MercadoPago</Text>
                    
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>¿Cómo conectar tu cuenta?</Text>
                      <Text style={styles.instructionsText}>
                        • Ingresa el email que usas en tu cuenta de MercadoPago{'\n'}
                        • Este será el email donde recibes pagos{'\n'}
                        • Puedes ponerle un nombre personalizado para identificarla
                      </Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email de tu cuenta MercadoPago *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="ejemplo@gmail.com"
                        value={mercadopagoForm.email}
                        onChangeText={(text: string) => setMercadopagoForm({ ...mercadopagoForm, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                      <Text style={styles.inputHelper}>
                        Debe ser el mismo email registrado en MercadoPago
                      </Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nombre para identificar (opcional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Mi MercadoPago Personal"
                        value={mercadopagoForm.nickname}
                        onChangeText={(text: string) => setMercadopagoForm({ ...mercadopagoForm, nickname: text })}
                      />
                      <Text style={styles.inputHelper}>
                        Ej: "MercadoPago Personal", "Cuenta Principal", etc.
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.saveButton, !mercadopagoForm.email && styles.saveButtonDisabled]} 
                      onPress={handleAddMercadoPago}
                      disabled={!mercadopagoForm.email}
                    >
                      <Text style={[styles.saveButtonText, !mercadopagoForm.email && styles.saveButtonTextDisabled]}>
                        Conectar MercadoPago
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {addingType === 'bizum' && (
                  <View>
                    <Text style={styles.sectionTitle}>Conectar Bizum</Text>
                    
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>¿Cómo funciona Bizum?</Text>
                      <Text style={styles.instructionsText}>
                        • Ingresa el número de teléfono asociado a tu cuenta Bizum{'\n'}
                        • Debe ser el mismo número registrado en tu banco{'\n'}
                        • Podrás recibir pagos instantáneos desde cualquier banco español
                      </Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Teléfono Bizum *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+34 600 123 456"
                        value={bizumForm.phone}
                        onChangeText={(text: string) => setBizumForm({ ...bizumForm, phone: text })}
                        keyboardType="phone-pad"
                      />
                      <Text style={styles.inputHelper}>
                        El número debe estar registrado en Bizum con tu banco
                      </Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nombre para identificar (opcional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Mi Bizum Personal"
                        value={bizumForm.nickname}
                        onChangeText={(text: string) => setBizumForm({ ...bizumForm, nickname: text })}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.saveButton, !bizumForm.phone && styles.saveButtonDisabled]}
                      onPress={handleAddBizum}
                      disabled={!bizumForm.phone}
                    >
                      <Text style={[styles.saveButtonText, !bizumForm.phone && styles.saveButtonTextDisabled]}>
                        Conectar Bizum
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.backToSelectionButton}
                  onPress={() => {
                    setAddingType(null);
                    resetForms();
                  }}
                >
                  <Text style={styles.backToSelectionText}>← Volver a selección</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    marginBottom: 20,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  paymentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 15,
  },
  mercadopagoIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#00b3f0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mercadopagoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  bizumIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#37a0b4',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  backToSelectionButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  backToSelectionText: {
    fontSize: 16,
    color: Colors.primary,
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 5,
  },
  inputHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
});