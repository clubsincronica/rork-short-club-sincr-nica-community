import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  X,
  Volume2,
  Activity,
  Calendar,
  DollarSign,
  Users,
  MessageCircle,
  Settings,
  CheckCircle,
  AlertCircle
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';
import { NotificationManager } from '@/utils/notificationManager';

interface NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

interface NotificationSettingsState {
  reservation_confirmed: boolean;
  reservation_cancelled: boolean;
  event_reminder: boolean;
  event_starting: boolean;
  payment_received: boolean;
  new_reservation: boolean;
  attendance_reminder: boolean;
  event_updated: boolean;
  general: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderMinutes: number;
}

export function NotificationSettings({ visible, onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsState>({
    reservation_confirmed: true,
    reservation_cancelled: true,
    event_reminder: true,
    event_starting: true,
    payment_received: true,
    new_reservation: true,
    attendance_reminder: true,
    event_updated: true,
    general: true,
    soundEnabled: true,
    vibrationEnabled: true,
    reminderMinutes: 60,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const savedSettings = await NotificationManager.getNotificationSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await NotificationManager.updateNotificationSettings(settings);
      Alert.alert('Éxito', 'Configuración de notificaciones actualizada');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'No se pudieron guardar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await NotificationManager.sendTestNotification();
      Alert.alert('Éxito', 'Notificación de prueba enviada');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'No se pudo enviar la notificación de prueba');
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Limpiar Notificaciones',
      '¿Estás seguro de que deseas eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationManager.clearAllNotifications();
              Alert.alert('Éxito', 'Todas las notificaciones han sido eliminadas');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar las notificaciones');
            }
          }
        }
      ]
    );
  };

  const toggleSetting = (key: keyof NotificationSettingsState, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const reminderOptions = [
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '1 día', value: 1440 },
  ];

  const notificationCategories = [
    {
      title: 'Reservas y Eventos',
      icon: Calendar,
      color: Colors.primary,
      settings: [
        {
          key: 'reservation_confirmed' as const,
          title: 'Reserva Confirmada',
          description: 'Cuando tu reserva sea confirmada',
        },
        {
          key: 'reservation_cancelled' as const,
          title: 'Reserva Cancelada',
          description: 'Cuando una reserva sea cancelada',
        },
        {
          key: 'event_reminder' as const,
          title: 'Recordatorio de Evento',
          description: 'Antes de que comience tu evento',
        },
        {
          key: 'attendance_reminder' as const,
          title: 'Recordatorio de Asistencia',
          description: 'El día de tu evento reservado',
        },
        {
          key: 'event_updated' as const,
          title: 'Evento Actualizado',
          description: 'Cuando se actualice información de un evento',
        },
      ],
    },
    {
      title: 'Para Organizadores',
      icon: Users,
      color: Colors.secondary,
      settings: [
        {
          key: 'new_reservation' as const,
          title: 'Nueva Reserva',
          description: 'Cuando recibas una nueva reserva',
        },
        {
          key: 'event_starting' as const,
          title: 'Evento Iniciando',
          description: 'Cuando tu evento esté por comenzar',
        },
        {
          key: 'payment_received' as const,
          title: 'Pago Recibido',
          description: 'Cuando recibas un pago',
        },
      ],
    },
    {
      title: 'General',
      icon: MessageCircle,
      color: Colors.info,
      settings: [
        {
          key: 'general' as const,
          title: 'Notificaciones Generales',
          description: 'Actualizaciones y mensajes de la app',
        },
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Bell size={24} color={Colors.white} />
            <Text style={styles.headerTitle}>Configuración de Notificaciones</Text>
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveSettings}
            disabled={loading}
          >
            <CheckCircle size={24} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* System Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración del Sistema</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Volume2 size={20} color={Colors.primary} />
                <Text style={styles.settingTitle}>Sonido</Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => toggleSetting('soundEnabled', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Activity size={20} color={Colors.primary} />
                <Text style={styles.settingTitle}>Vibración</Text>
              </View>
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={(value) => toggleSetting('vibrationEnabled', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Reminder Timing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiempo de Recordatorio</Text>
            <Text style={styles.sectionDescription}>
              Con cuánta anticipación recibir recordatorios de eventos
            </Text>
            
            <View style={styles.reminderOptions}>
              {reminderOptions.map((option) => (
                <TouchableScale
                  key={option.value}
                  style={[
                    styles.reminderOption,
                    settings.reminderMinutes === option.value && styles.reminderOptionSelected
                  ]}
                  onPress={() => toggleSetting('reminderMinutes', option.value)}
                >
                  <Text style={[
                    styles.reminderOptionText,
                    settings.reminderMinutes === option.value && styles.reminderOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {settings.reminderMinutes === option.value && (
                    <CheckCircle size={16} color={Colors.white} />
                  )}
                </TouchableScale>
              ))}
            </View>
          </View>

          {/* Notification Categories */}
          {notificationCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.section}>
              <View style={styles.categoryHeader}>
                <category.icon size={20} color={category.color} />
                <Text style={styles.sectionTitle}>{category.title}</Text>
              </View>
              
              {category.settings.map((setting) => (
                <View key={setting.key} style={styles.settingCard}>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={settings[setting.key] as boolean}
                    onValueChange={(value) => toggleSetting(setting.key, value)}
                    trackColor={{ false: Colors.border, true: category.color }}
                    thumbColor={Colors.white}
                  />
                </View>
              ))}
            </View>
          ))}

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            
            <TouchableScale
              style={styles.actionButton}
              onPress={sendTestNotification}
            >
              <AlertCircle size={20} color={Colors.info} />
              <Text style={styles.actionButtonText}>Enviar Notificación de Prueba</Text>
            </TouchableScale>

            <TouchableScale
              style={[styles.actionButton, styles.dangerButton]}
              onPress={clearAllNotifications}
            >
              <X size={20} color={Colors.error} />
              <Text style={[styles.actionButtonText, styles.dangerText]}>
                Limpiar Todas las Notificaciones
              </Text>
            </TouchableScale>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  settingCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reminderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  reminderOptionTextSelected: {
    color: Colors.white,
  },
  actionButton: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  dangerText: {
    color: Colors.error,
  },
  bottomPadding: {
    height: 40,
  },
});