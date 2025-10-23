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
  Shield,
  Eye,
  EyeOff,
  Lock,
  Database,
  UserX,
  Trash2,
  Download,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from '../components/SmartIcons';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText } from '@/components/AccessibleText';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, updatePreferences } = useUser();
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    activityTracking: true,
    dataCollection: true,
    thirdPartySharing: false,
    marketingEmails: false,
    locationTracking: false,
    crashReports: true,
    analytics: true,
  });

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción es irreversible. Se eliminarán todos tus datos permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmación Final',
              '¿Estás completamente seguro? Esta acción no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sí, eliminar mi cuenta',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada exitosamente.');
                    // Here you would implement actual account deletion
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Te enviaremos un archivo con todos tus datos a tu email registrado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: () => {
            Alert.alert('Éxito', 'Solicitud de exportación enviada. Recibirás un email en las próximas 24 horas.');
          },
        },
      ]
    );
  };

  const privacySections = [
    {
      title: 'Visibilidad del Perfil',
      items: [
        {
          icon: Eye,
          title: 'Perfil Público',
          description: 'Otros usuarios pueden ver tu perfil',
          key: 'profileVisibility',
          type: 'switch' as const,
        },
        {
          icon: Database,
          title: 'Seguimiento de Actividad',
          description: 'Registrar tu actividad en la app',
          key: 'activityTracking',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Recopilación de Datos',
      items: [
        {
          icon: Database,
          title: 'Datos de Uso',
          description: 'Recopilar datos sobre cómo usas la app',
          key: 'dataCollection',
          type: 'switch' as const,
        },
        {
          icon: Shield,
          title: 'Compartir con Terceros',
          description: 'Compartir datos con socios de confianza',
          key: 'thirdPartySharing',
          type: 'switch' as const,
        },
        {
          icon: Lock,
          title: 'Ubicación',
          description: 'Acceso a tu ubicación para servicios locales',
          key: 'locationTracking',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Comunicaciones',
      items: [
        {
          icon: FileText,
          title: 'Emails de Marketing',
          description: 'Recibir ofertas y promociones por email',
          key: 'marketingEmails',
          type: 'switch' as const,
        },
      ],
    },
    {
      title: 'Diagnósticos',
      items: [
        {
          icon: AlertTriangle,
          title: 'Informes de Errores',
          description: 'Enviar informes automáticos de errores',
          key: 'crashReports',
          type: 'switch' as const,
        },
        {
          icon: Database,
          title: 'Análisis de Rendimiento',
          description: 'Datos para mejorar el rendimiento de la app',
          key: 'analytics',
          type: 'switch' as const,
        },
      ],
    },
  ];

  const dataManagementItems = [
    {
      icon: Download,
      title: 'Exportar Mis Datos',
      description: 'Descargar una copia de todos tus datos',
      onPress: handleExportData,
    },
    {
      icon: FileText,
      title: 'Política de Privacidad',
      description: 'Leer nuestra política de privacidad completa',
      onPress: () => Alert.alert('Próximamente', 'La política de privacidad estará disponible pronto'),
    },
    {
      icon: Shield,
      title: 'Términos de Servicio',
      description: 'Revisar los términos y condiciones',
      onPress: () => Alert.alert('Próximamente', 'Los términos de servicio estarán disponibles pronto'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad y Seguridad</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {privacySections.map((section, sectionIndex) => (
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
                <Switch
                  value={privacySettings[item.key as keyof typeof privacySettings] as boolean}
                  onValueChange={(value) => handlePrivacyChange(item.key, value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de Datos</Text>
          {dataManagementItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.actionItem} onPress={item.onPress}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <item.icon size={20} color={Colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zona de Peligro</Text>
          <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, styles.dangerIcon]}>
                <UserX size={20} color={Colors.error} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Eliminar Cuenta</Text>
                <Text style={styles.settingDescription}>
                  Eliminar permanentemente tu cuenta y todos los datos
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Tu privacidad es importante para nosotros</Text>
          <Text style={styles.footerSubtext}>
            Estos ajustes te permiten controlar cómo se usan tus datos
          </Text>
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
  actionItem: {
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
  dangerIcon: {
    backgroundColor: Colors.error + '20',
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
  dangerText: {
    color: Colors.error,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  dangerZone: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 12,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
