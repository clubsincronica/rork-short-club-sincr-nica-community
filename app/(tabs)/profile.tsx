import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Modal, TextInput, Alert } from 'react-native';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText, Heading } from '@/components/AccessibleText';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Edit3,
  Star,
  MapPin,
  Calendar,
  Award,
  Settings,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  Save,
  Camera,
  Trophy,
  Heart,
  Activity,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  User,
  Mail,
  Lock,
  Globe,
  DollarSign,
  ChevronDown,
  ChevronUp
} from '@/components/SmartIcons';
import { useUser } from '@/hooks/user-store';
import { Colors, Gradients } from '@/constants/colors';
import { useAppSettings } from '@/hooks/app-settings-store';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import * as ImagePicker from 'expo-image-picker';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  earnedDate?: string;
}

interface Activity {
  id: string;
  type: 'booking' | 'review' | 'achievement';
  title: string;
  description: string;
  date: string;
  icon: any;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, logout, updateUser, login } = useUser();
  const { settings } = useAppSettings();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSignupModalVisible, setIsSignupModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'achievements'>('activity');
  const [isMiCuentaExpanded, setIsMiCuentaExpanded] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const [editedProfile, setEditedProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    specialties: currentUser?.specialties || [],
    interests: currentUser?.interests || [],
    avatar: currentUser?.avatar || '',
    instagram: currentUser?.instagram || '',
    facebook: currentUser?.facebook || '',
    tiktok: currentUser?.tiktok || '',
    twitter: currentUser?.twitter || '',
    linkedin: currentUser?.linkedin || '',
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Sync editedProfile with currentUser when it changes (preserves avatar updates)
  useEffect(() => {
    if (currentUser) {
      setEditedProfile({
        name: currentUser.name || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        specialties: currentUser.specialties || [],
        interests: currentUser.interests || [],
        avatar: currentUser.avatar || '',
        instagram: currentUser.instagram || '',
        facebook: currentUser.facebook || '',
        tiktok: currentUser.tiktok || '',
        twitter: currentUser.twitter || '',
        linkedin: currentUser.linkedin || '',
      });
    }
  }, [currentUser]);

  // Remove mock achievements and activities - will be populated from backend
  const achievements: Achievement[] = [];

  const activities: Activity[] = [];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setEditedProfile({ ...editedProfile, avatar: result.assets[0].uri });
    }
  };

  const handleLogin = () => {
    if (!loginForm.email || !loginForm.password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    login({
      id: 1,
      name: 'Usuario Demo',
      email: loginForm.email,
      avatar: 'https://i.pravatar.cc/150?img=3',
      bio: 'Practicante de bienestar holístico',
      location: 'Madrid, España',
      joinedDate: new Date().toISOString(),
      rating: 4.8,
      reviewCount: 12,
      verified: true,
      specialties: ['Reiki', 'Meditación'],
      interests: ['Yoga', 'Nutrición'],
    });
    setIsLoginModalVisible(false);
    setLoginForm({ email: '', password: '' });
  };

  const handleSignup = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    login({
      id: 1,
      name: signupForm.name,
      email: signupForm.email,
      avatar: 'https://i.pravatar.cc/150?img=5',
      bio: '',
      location: '',
      joinedDate: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      verified: false,
      specialties: [],
      interests: [],
    });
    setIsSignupModalVisible(false);
    setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Agregar Método de Pago', 'Esta función estará disponible pronto');
  };

  const handleDeletePaymentMethod = (id: string) => {
    Alert.alert(
      'Eliminar Método de Pago',
      '¿Estás seguro de que deseas eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setPaymentMethods(paymentMethods.filter(pm => pm.id !== id)),
        },
      ]
    );
  };

  if (!currentUser) {
    return (
      <ConstellationBackground intensity="light">
        <View style={styles.container}>
          <View style={styles.loginPrompt}>
            <LinearGradient
              colors={[Colors.gold || '#fbeb5c', Colors.goldLight || '#fbac94']}
              style={styles.logoContainer}
            >
              <User size={40} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.loginTitle}>Bienvenido a Club Sincrónica</Text>
            <Text style={styles.loginDescription}>
              Únete a nuestra comunidad de bienestar holístico y conecta con practicantes conscientes.
            </Text>
            <TouchableScale
              style={styles.primaryButton}
              onPress={() => setIsLoginModalVisible(true)}
              testID="login-button"
              accessibilityLabel="Iniciar sesión en tu cuenta"
            >
              <AccessibleText style={styles.primaryButtonText}>Iniciar Sesión</AccessibleText>
            </TouchableScale>
            <TouchableScale
              style={styles.secondaryButton}
              onPress={() => setIsSignupModalVisible(true)}
              testID="signup-button"
              accessibilityLabel="Crear una nueva cuenta"
            >
              <AccessibleText style={styles.secondaryButtonText}>Crear Cuenta</AccessibleText>
            </TouchableScale>
          </View>
        </View>
      </ConstellationBackground>
    );
  }

  const handleSaveProfile = () => {
    if (currentUser) {
      updateUser({
        ...currentUser,
        ...editedProfile,
      });
    }
    setIsEditModalVisible(false);
    Alert.alert('Éxito', 'Tu perfil ha sido actualizado');
  };

  const menuItems = [
    {
      icon: Calendar,
      title: 'Mi Calendario',
      subtitle: 'Gestiona tus eventos y citas',
      onPress: () => router.push('/calendar'),
      testId: 'calendar',
      highlight: true,
    },
    {
      icon: Activity,
      title: 'Mi Tablero',
      subtitle: 'Gestiona tus servicios y eventos',
      onPress: () => router.push('/mi-tablero'),
      testId: 'mi-tablero',
      highlight: true,
    },
  ];

  const miCuentaItems = [
    {
      icon: Edit3,
      title: 'Editar Perfil',
      subtitle: 'Actualiza tu información',
      onPress: () => setIsEditModalVisible(true),
      testId: 'edit-profile',
    },
    {
      icon: Globe,
      title: 'Language & Region',
      subtitle: settings.language ? `${settings.language.nativeName} • ${settings.location?.city || 'Not set'}` : 'Set your preferences',
      onPress: () => router.push('/onboarding'),
      testId: 'localization',
    },
    {
      icon: CreditCard,
      title: 'Métodos de Pago',
      subtitle: 'Gestiona tarjetas y facturación',
      onPress: () => router.push('/payment-methods'),
      testId: 'payment-methods',
    },
    {
      icon: DollarSign,
      title: 'Cuentas Bancarias',
      subtitle: 'Gestiona tus cuentas',
      onPress: () => router.push('/bank-accounts'),
      testId: 'bank-accounts',
    },
    {
      icon: Bell,
      title: 'Notificaciones',
      subtitle: 'Notificaciones push',
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      ),
      testId: 'notifications',
    },
    {
      icon: Shield,
      title: 'Privacidad y Seguridad',
      subtitle: 'Controla tus datos',
      onPress: () => router.push('/privacy'),
      testId: 'privacy',
    },
    {
      icon: Settings,
      title: 'Configuración de la App',
      subtitle: 'Preferencias y más',
      onPress: () => router.push('/settings'),
      testId: 'settings',
    },
  ];

  const additionalMenuItems = [
    {
      icon: User,
      title: 'Vista Previa del Perfil',
      subtitle: 'Ver cómo te ven otros usuarios',
      onPress: () => router.push({
        pathname: '/user-profile',
        params: {
          userId: currentUser.id,
          userName: currentUser.name,
          userLocation: currentUser.location,
          isOwnProfile: 'true',
        }
      }),
      testId: 'profile-preview',
      highlight: true,
    },
    {
      icon: HelpCircle,
      title: 'Ayuda y Soporte',
      subtitle: 'Obtén asistencia',
      onPress: () => router.push('/help'),
      testId: 'help',
      highlight: true,
    },
  ];

  return (
    <ConstellationBackground intensity="light">
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient colors={Gradients.primary || ['#4f8497', '#549ab4']} style={[styles.header, { paddingTop: insets.top }]}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
                {currentUser.verified && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={16} color={Colors.white} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <Camera size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userEmail}>{currentUser.email}</Text>

              {currentUser.bio && (
                <Text style={styles.userBio}>{currentUser.bio}</Text>
              )}

              <View style={styles.userDetails}>
                {currentUser.location && (
                  <View style={styles.detailItem}>
                    <MapPin size={14} color={Colors.white} />
                    <Text style={styles.detailText}>{currentUser.location}</Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Calendar size={14} color={Colors.white} />
                  <Text style={styles.detailText}>
                    Se unió {new Date(currentUser.joinedDate).toLocaleDateString('es-ES', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.rating}</Text>
              <View style={styles.statLabel}>
                <Star size={14} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.statText}>Calificación</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.reviewCount}</Text>
              <Text style={styles.statText}>Reseñas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.specialties?.length || 0}</Text>
              <Text style={styles.statText}>Especialidades</Text>
            </View>
          </View>

          {(currentUser.specialties?.length || 0) > 0 && (
            <View style={styles.specialtiesContainer}>
              <Text style={styles.sectionTitle}>Especialidades</Text>
              <View style={styles.specialtiesList}>
                {(currentUser.specialties || []).map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.tabContainer}>
            <View style={styles.tabButtons}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'activity' && styles.tabButtonActive]}
                onPress={() => setActiveTab('activity')}
              >
                <Activity size={18} color={activeTab === 'activity' ? Colors.primary : Colors.textLight} />
                <Text style={[styles.tabButtonText, activeTab === 'activity' && styles.tabButtonTextActive]}>
                  Actividad
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'achievements' && styles.tabButtonActive]}
                onPress={() => setActiveTab('achievements')}
              >
                <Trophy size={18} color={activeTab === 'achievements' ? Colors.primary : Colors.textLight} />
                <Text style={[styles.tabButtonText, activeTab === 'achievements' && styles.tabButtonTextActive]}>
                  Logros
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'activity' ? (
              <View style={styles.activityList}>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={[styles.activityIcon, activity.type === 'achievement' && styles.activityIconHighlight]}>
                        <activity.icon size={20} color={activity.type === 'achievement' ? Colors.gold : Colors.primary} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                        <View style={styles.activityDate}>
                          <Clock size={12} color={Colors.textLight} />
                          <Text style={styles.activityDateText}>
                            {new Date(activity.date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Activity size={48} color={Colors.textLight} />
                    <Text style={styles.emptyStateTitle}>Sin Actividad</Text>
                    <Text style={styles.emptyStateText}>
                      Tu actividad reciente aparecerá aquí
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.achievementGrid}>
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <View
                      key={achievement.id}
                      style={[styles.achievementCard, achievement.earned && styles.achievementCardEarned]}
                    >
                      <View style={[styles.achievementIcon, achievement.earned && styles.achievementIconEarned]}>
                        <achievement.icon
                          size={24}
                          color={achievement.earned ? Colors.gold : Colors.textLight}
                        />
                      </View>
                      <Text style={[styles.achievementTitle, achievement.earned && styles.achievementTitleEarned]}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                      {achievement.earned && achievement.earnedDate && (
                        <Text style={styles.achievementDate}>
                          {new Date(achievement.earnedDate).toLocaleDateString('es-ES', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Trophy size={48} color={Colors.textLight} />
                    <Text style={styles.emptyStateTitle}>Sin Logros</Text>
                    <Text style={styles.emptyStateText}>
                      Completa actividades para desbloquear logros
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, item.highlight && styles.menuItemHighlight]}
                onPress={item.onPress}
                testID={item.testId}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, item.highlight && styles.menuIconHighlight]}>
                    <item.icon size={20} color={item.highlight ? Colors.white : Colors.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, item.highlight && styles.menuTitleHighlight]}>
                      {item.title}
                    </Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}

            {/* Mi Cuenta Collapsible Section */}
            <TouchableOpacity
              style={[styles.menuItem, styles.miCuentaButton]}
              onPress={() => setIsMiCuentaExpanded(!isMiCuentaExpanded)}
              testID="mi-cuenta-toggle"
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, styles.miCuentaIcon]}>
                  <User size={20} color={Colors.gold} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, styles.miCuentaTitle]}>Mi Cuenta</Text>
                  <Text style={styles.menuSubtitle}>Ajustes de perfil y seguridad</Text>
                </View>
              </View>
              {isMiCuentaExpanded ? (
                <ChevronUp size={20} color={Colors.gold} />
              ) : (
                <ChevronDown size={20} color={Colors.gold} />
              )}
            </TouchableOpacity>

            {/* Mi Cuenta Submenu Items */}
            {isMiCuentaExpanded && (
              <View style={styles.submenuContainer}>
                {miCuentaItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.submenuItem}
                    onPress={item.onPress}
                    testID={item.testId}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.submenuIcon}>
                        <item.icon size={18} color={Colors.primary} />
                      </View>
                      <View style={styles.menuContent}>
                        <Text style={styles.submenuTitle}>{item.title}</Text>
                        <Text style={styles.submenuSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    {item.rightComponent || <ChevronRight size={18} color={Colors.textLight} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Additional Menu Items */}
            {additionalMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, item.highlight && styles.menuItemHighlight]}
                onPress={item.onPress}
                testID={item.testId}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, item.highlight && styles.menuIconHighlight]}>
                    <item.icon size={20} color={item.highlight ? Colors.primary : Colors.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, item.highlight && styles.menuTitleHighlight]}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                logout();
                router.replace('/login');
              }}
              testID="logout-button"
            >
              <LogOut size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Club Sincrónica v1.0.0</Text>
            <Text style={styles.footerSubtext}>Hecho con ❤️ para el bienestar holístico</Text>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity style={styles.avatarEditContainer} onPress={pickImage}>
                <Image source={{ uri: editedProfile.avatar }} style={styles.avatarEdit} />
                <View style={styles.avatarEditOverlay}>
                  <Camera size={24} color={Colors.white} />
                  <Text style={styles.avatarEditText}>Cambiar foto</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.name}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.email}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Biografía</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder="Cuéntanos sobre ti..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.location}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, location: text })}
                  placeholder="Ciudad, País"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Especialidades (separadas por comas)</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.specialties?.join(', ')}
                  onChangeText={(text) => setEditedProfile({
                    ...editedProfile,
                    specialties: text.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  placeholder="Reiki, Masaje, Terapia..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Intereses (separados por comas)</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.interests?.join(', ')}
                  onChangeText={(text) => setEditedProfile({
                    ...editedProfile,
                    interests: text.split(',').map(i => i.trim()).filter(i => i)
                  })}
                  placeholder="Yoga, Meditación, Nutrición..."
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 20, marginBottom: 12 }]}>Redes Sociales</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instagram</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.instagram}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, instagram: text })}
                  placeholder="@usuario"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Facebook</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.facebook}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, facebook: text })}
                  placeholder="nombre.usuario"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TikTok</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.tiktok}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, tiktok: text })}
                  placeholder="@usuario"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Twitter/X</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.twitter}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, twitter: text })}
                  placeholder="@usuario"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LinkedIn</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.linkedin}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, linkedin: text })}
                  placeholder="nombre-usuario"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Save size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isLoginModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Iniciar Sesión</Text>
              <TouchableOpacity onPress={() => setIsLoginModalVisible(false)}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.inputWithIcon}
                  value={loginForm.email}
                  onChangeText={(text) => setLoginForm({ ...loginForm, email: text })}
                  placeholder="Email"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.inputWithIcon}
                  value={loginForm.password}
                  onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
                  placeholder="Contraseña"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleLogin}>
              <Text style={styles.saveButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <View style={styles.switchAuth}>
              <Text style={styles.switchAuthText}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={() => {
                setIsLoginModalVisible(false);
                setIsSignupModalVisible(true);
              }}>
                <Text style={styles.switchAuthLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSignupModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Cuenta</Text>
              <TouchableOpacity onPress={() => setIsSignupModalVisible(false)}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User size={20} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.inputWithIcon}
                  value={signupForm.name}
                  onChangeText={(text) => setSignupForm({ ...signupForm, name: text })}
                  placeholder="Nombre completo"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.inputWithIcon}
                  value={signupForm.email}
                  onChangeText={(text) => setSignupForm({ ...signupForm, email: text })}
                  placeholder="Email"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.inputWithIcon}
                  value={signupForm.password}
                  onChangeText={(text) => setSignupForm({ ...signupForm, password: text })}
                  placeholder="Contraseña"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.inputWithIcon}
                  value={signupForm.confirmPassword}
                  onChangeText={(text) => setSignupForm({ ...signupForm, confirmPassword: text })}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSignup}>
              <Text style={styles.saveButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            <View style={styles.switchAuth}>
              <Text style={styles.switchAuthText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => {
                setIsSignupModalVisible(false);
                setIsLoginModalVisible(true);
              }}>
                <Text style={styles.switchAuthLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPaymentModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Métodos de Pago</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {paymentMethods.map((method) => (
                <View key={method.id} style={styles.paymentMethod}>
                  <View style={styles.paymentMethodInfo}>
                    <CreditCard size={24} color={Colors.primary} />
                    <View style={styles.paymentMethodDetails}>
                      <Text style={styles.paymentMethodBrand}>
                        {method.brand} •••• {method.last4}
                      </Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Predeterminado</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeletePaymentMethod(method.id)}>
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addPaymentButton} onPress={handleAddPaymentMethod}>
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addPaymentText}>Agregar método de pago</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ConstellationBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 30,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.gold,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  userBio: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  userDetails: {
    alignItems: 'center',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -15,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  specialtiesContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  specialtyText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  menuItem: {
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
  menuItemHighlight: {
    borderWidth: 2,
    borderColor: Colors.gold || '#fbeb5c',
    backgroundColor: Colors.white,
  },
  menuIconHighlight: {
    backgroundColor: Colors.gold || '#fbeb5c',
  },
  menuTitleHighlight: {
    color: Colors.text,
    fontWeight: '700',
  },
  miCuentaButton: {
    borderWidth: 2,
    borderColor: Colors.gold || '#fbeb5c',
    backgroundColor: Colors.white,
  },
  miCuentaIcon: {
    backgroundColor: Colors.gold || '#fbeb5c',
  },
  miCuentaTitle: {
    color: Colors.text,
    fontWeight: '700',
  },
  submenuContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 4,
    marginLeft: 8,
    marginRight: 0,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold || '#fbeb5c',
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  submenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  submenuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  submenuSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
  },
  menuItemRight: {
    marginLeft: 12,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
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
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginDescription: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 12,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 25,
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
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
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.secondary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconHighlight: {
    backgroundColor: `${Colors.gold}20`,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  activityDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityDateText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    opacity: 0.7,
  },
  achievementCardEarned: {
    opacity: 1,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIconEarned: {
    backgroundColor: Colors.gold + '20',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementTitleEarned: {
    color: Colors.text,
  },
  achievementDescription: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '600',
  },
  avatarEditContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatarEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEditOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditText: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
  },
  inputWithIcon: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    paddingLeft: 44,
    fontSize: 16,
    color: Colors.text,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
  },
  switchAuth: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  switchAuthText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  switchAuthLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodDetails: {
    gap: 4,
  },
  paymentMethodBrand: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addPaymentText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
