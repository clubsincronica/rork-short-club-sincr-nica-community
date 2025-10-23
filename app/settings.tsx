import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Database,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText } from '@/components/AccessibleText';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, preferences, updatePreferences } = useUser();
  const [localSettings, setLocalSettings] = useState({
    pushNotifications: preferences?.notifications ?? true,
    emailNotifications: preferences?.newsletter ?? false,
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: preferences?.theme === 'dark',
    autoSync: true,
    offlineMode: false,
    dataCollection: true,
    crashReports: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    
    // Update user preferences for relevant settings
    if (key === 'pushNotifications') {
      updatePreferences({ notifications: value });
    } else if (key === 'emailNotifications') {
      updatePreferences({ newsletter: value });
    } else if (key === 'darkMode') {
      updatePreferences({ theme: value ? 'dark' : 'light' });
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            setLocalSettings({
              pushNotifications: true,
              emailNotifications: false,
              soundEnabled: true,
              vibrationEnabled: true,
              darkMode: false,
              autoSync: true,
              offlineMode: false,
              dataCollection: true,
              crashReports: true,
            });
            updatePreferences({
              notifications: true,
              newsletter: false,
              theme: 'light',
            });
            Alert.alert('Éxito', 'Configuración restablecida');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Caché',
      'Esto eliminará todos los datos temporales de la aplicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: () => {
            Alert.alert('Éxito', 'Caché limpiado correctamente');
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Notificaciones',
      items: [
        {
          icon: Bell,
          title: 'Notificaciones Push',
          description: 'Recibe notificaciones en tu dispositivo',
          key: 'pushNotifications',
          type: 'switch' as const,
        },
        {
          icon: Globe,
          title: 'Notificaciones por Email',
          description: 'Recibe actualizaciones por correo electrónico',
          key: 'emailNotifications',
          type: 'switch' as const,
        },
        {
          icon: Volume2,
          title: 'Sonidos',
          description: 'Reproducir sonidos de notificación',
          key: 'soundEnabled',
          type: 'switch' as const,
        },
        {
          icon: Smartphone,
          title: 'Vibración',
          description: 'Vibrar para notificaciones',
          key: 'vibrationEnabled',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Apariencia',
      items: [
        {
          icon: localSettings.darkMode ? Moon : Sun,
          title: 'Modo Oscuro',
          description: 'Usar tema oscuro en la aplicación',
          key: 'darkMode',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Datos y Sincronización',
      items: [
        {
          icon: RefreshCw,
          title: 'Sincronización Automática',
          description: 'Sincronizar datos automáticamente',
          key: 'autoSync',
          type: 'switch' as const,
        },
        {
          icon: localSettings.offlineMode ? EyeOff : Eye,
          title: 'Modo Sin Conexión',
          description: 'Trabajar sin conexión a internet',
          key: 'offlineMode',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Privacidad',
      items: [
        {
          icon: Database,
          title: 'Recopilación de Datos',
          description: 'Permitir recopilación de datos de uso',
          key: 'dataCollection',
          type: 'switch' as const,
        },
        {
          icon: Shield,
          title: 'Informes de Errores',
          description: 'Enviar informes de errores automáticamente',
          key: 'crashReports',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Mantenimiento',
      items: [
        {
          icon: Trash2,
          title: 'Limpiar Caché',
          description: 'Eliminar archivos temporales',
          type: 'action' as const,
          onPress: handleClearCache,
        },
        {
          icon: Download,
          title: 'Exportar Datos',
          description: 'Descargar una copia de tus datos',
          type: 'action' as const,
          onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
        },
        {
          icon: RefreshCw,
          title: 'Restablecer Configuración',
          description: 'Volver a la configuración predeterminada',
          type: 'action' as const,
          onPress: handleResetSettings,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <item.icon size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  {item.type === 'switch' && (
                    <Switch
                      value={localSettings[item.key as keyof typeof localSettings] as boolean}
                      onValueChange={(value) => handleSettingChange(item.key!, value)}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.white}
                    />
                  )}
                  {item.type === 'action' && (
                    <TouchableScale onPress={item.onPress} style={styles.actionButton}>
                      <AccessibleText style={styles.actionButtonText}>Ejecutar</AccessibleText>
                    </TouchableScale>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Club Sincrónica v1.0.0</Text>
          <Text style={styles.footerSubtext}>Configuración guardada automáticamente</Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  settingRight: {
    marginLeft: 12,
  },
  actionButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.textLight,
    opacity: 0.7,
  },
});
