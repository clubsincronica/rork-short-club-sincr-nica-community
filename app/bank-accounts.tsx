import React from 'react';
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
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign,
} from '@/components/SmartIcons';
import { useUser } from '@/hooks/user-store';
import { BankAccount } from '@/types/user';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

// Estado global simple
interface GlobalState {
  modalVisible: boolean;
  editingAccount: BankAccount | null;
  formData: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    percentage: number;
    nickname: string;
  };
  updateCounter: number;
}

let globalState: GlobalState = {
  modalVisible: false,
  editingAccount: null,
  formData: {
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    percentage: 0,
    nickname: '',
  },
  updateCounter: 0,
};

export default function BankAccountsManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, addBankAccount, updateBankAccount, removeBankAccount } = useUser();
  
  // Use global state with a simpler approach that forces re-renders
  const modalVisible = globalState.modalVisible;
  const editingAccount = globalState.editingAccount;
  const formData = globalState.formData;

  const bankColors = {
    primary: '#2563eb',
    primaryLight: '#3b82f6', 
    primaryDark: '#1d4ed8',
    secondary: '#eff6ff',
    accent: '#1e40af',
    success: '#059669',
    card: '#f8fafc',
    border: '#cbd5e1',
  };

  const resetForm = () => {
    globalState.formData = {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      percentage: 0,
      nickname: '',
    };
    globalState.editingAccount = null;
  };

  const openAddModal = () => {
    resetForm();
    globalState.modalVisible = true;
    globalState.editingAccount = null;
    // Force component refresh by navigating away and back
    setTimeout(() => {
      router.replace('/bank-accounts');
    }, 1);
  };

  const closeModal = () => {
    globalState.modalVisible = false;
    globalState.editingAccount = null;
    resetForm();
    // Force component refresh
    setTimeout(() => {
      router.replace('/bank-accounts');
    }, 1);
  };

  const openEditModal = (account: BankAccount) => {
    globalState.formData = {
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
      percentage: account.percentage,
      nickname: account.nickname || '',
    };
    globalState.editingAccount = account;
    globalState.modalVisible = true;
    // Force component refresh
    setTimeout(() => {
      router.replace('/bank-accounts');
    }, 1);
  };

  const handleSave = () => {
    if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Ensure percentage is a number
    const percentage = typeof formData.percentage === 'number' ? formData.percentage : parseFloat(formData.percentage) || 0;
    
    if (percentage <= 0) {
      Alert.alert('Error', 'El porcentaje debe ser mayor que 0');
      return;
    }

    const currentTotal = (currentUser?.bankAccounts || [])
      .filter((acc: BankAccount) => editingAccount ? acc.id !== editingAccount.id : true)
      .reduce((sum: number, acc: BankAccount) => sum + acc.percentage, 0);

    if (currentTotal + percentage > 100) {
      Alert.alert('Error', `El total de porcentajes no puede exceder 100%. Total actual: ${currentTotal}%, Nuevo: ${percentage}%`);
      return;
    }

    const accountData = {
      ...formData,
      percentage: percentage,
      // Add required BankAccount fields with defaults
      accountType: 'checking' as const,
      currency: 'EUR',
      country: 'ES',
      isVerified: false,
      isActive: true
    };

    try {
      if (editingAccount) {
        updateBankAccount({ accountId: editingAccount.id, updates: accountData });
        Alert.alert('Éxito', 'Cuenta actualizada correctamente');
      } else {
        addBankAccount(accountData);
        Alert.alert('Éxito', 'Cuenta añadida correctamente');
      }

      closeModal();
      resetForm();
    } catch (error) {
      console.error('Error saving bank account:', error);
      Alert.alert('Error', 'Hubo un problema al guardar la cuenta bancaria');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar esta cuenta bancaria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeBankAccount(id) }
      ]
    );
  };

  const updateFormField = (field: string, value: any) => {
    (globalState.formData as any)[field] = value;
    globalState.updateCounter = (globalState.updateCounter || 0) + 1;
    // Just update the state without navigation to avoid losing focus
  };

  // Temporarily always enable save button for testing
  const isFormValid = true; // formData.bankName && formData.accountNumber && formData.accountHolderName;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Cuentas Bancarias</Text>
        <TouchableOpacity 
          onPress={openAddModal}
          style={styles.addButton}
        >
          <Plus size={24} color={bankColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bank Accounts List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Gestiona tus Cuentas Bancarias</Text>
          <Text style={styles.instructionsText}>
            Configura múltiples cuentas bancarias y asigna porcentajes de distribución de ingresos. 
            El total debe sumar 100%.
          </Text>
        </View>

        {currentUser?.bankAccounts && currentUser.bankAccounts.length > 0 ? (
          <View style={styles.accountsList}>
            {currentUser.bankAccounts.map((account: BankAccount) => (
              <View key={account.id} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.bankIcon}>
                    <DollarSign size={20} color={bankColors.primary} />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.bankName}>{account.bankName}</Text>
                    <Text style={styles.accountNumber}>
                      •••• •••• •••• {account.accountNumber.slice(-4)}
                    </Text>
                    <Text style={styles.accountHolder}>{account.accountHolderName}</Text>
                    {account.nickname && (
                      <Text style={styles.nickname}>"{account.nickname}"</Text>
                    )}
                  </View>
                  <View style={styles.percentageContainer}>
                    <Text style={styles.percentageValue}>{account.percentage}%</Text>
                  </View>
                </View>

                <View style={styles.accountActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(account)}
                    style={styles.editButton}
                  >
                    <Edit3 size={16} color={bankColors.primary} />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(account.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color={Colors.error} />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Total Percentage Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Distribución Total</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Porcentaje asignado:</Text>
                <Text style={styles.summaryValue}>
                  {currentUser.bankAccounts.reduce((sum: number, acc: BankAccount) => sum + acc.percentage, 0)}%
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Porcentaje restante:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: 100 - currentUser.bankAccounts.reduce((sum: number, acc: BankAccount) => sum + acc.percentage, 0) === 0 ? bankColors.success : Colors.warning }
                ]}>
                  {100 - currentUser.bankAccounts.reduce((sum: number, acc: BankAccount) => sum + acc.percentage, 0)}%
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <DollarSign size={64} color={bankColors.border} />
            <Text style={styles.emptyTitle}>Sin Cuentas Bancarias</Text>
            <Text style={styles.emptyDescription}>
              Agrega tu primera cuenta bancaria para comenzar a recibir pagos
            </Text>
            <TouchableOpacity onPress={openAddModal} style={styles.emptyButton}>
              <Plus size={20} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Agregar Primera Cuenta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}
              </Text>
              <TouchableOpacity 
                onPress={closeModal}
                style={styles.modalCloseButton}
              >
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Bank Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Banco *</Text>
                <Text style={styles.inputHelper}>Nombre de la institución bancaria</Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formData.bankName}
                  onChangeText={(text: string) => updateFormField('bankName', text)}
                  placeholder="Ej: BBVA, Santander, CaixaBank"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Cuenta *</Text>
                <Text style={styles.inputHelper}>Tu número de cuenta bancaria</Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formData.accountNumber}
                  onChangeText={(text: string) => updateFormField('accountNumber', text)}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              {/* Account Holder */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Titular de la Cuenta *</Text>
                <Text style={styles.inputHelper}>Nombre completo del titular</Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formData.accountHolderName}
                  onChangeText={(text: string) => updateFormField('accountHolderName', text)}
                  placeholder="Nombre y apellidos"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {/* Percentage */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Porcentaje de Ingresos *</Text>
                <Text style={styles.inputHelper}>
                  Porcentaje de ingresos que se depositará en esta cuenta (0-100%)
                </Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formData.percentage ? formData.percentage.toString() : ''}
                  onChangeText={(text: string) => updateFormField('percentage', parseFloat(text) || 0)}
                  placeholder="50"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              {/* Nickname */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Apodo (Opcional)</Text>
                <Text style={styles.inputHelper}>Un nombre fácil de recordar para esta cuenta</Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formData.nickname}
                  onChangeText={(text: string) => updateFormField('nickname', text)}
                  placeholder="Ej: Cuenta Principal, Ahorros"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveButton, { opacity: isFormValid ? 1 : 0.5 }]}
                disabled={!isFormValid}
              >
                <Text style={styles.saveButtonText}>
                  {editingAccount ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  accountsList: {
    marginTop: 20,
    paddingBottom: 20,
  },
  accountCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bankIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  nickname: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },
  percentageContainer: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  accountActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  inputHelper: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 18,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});