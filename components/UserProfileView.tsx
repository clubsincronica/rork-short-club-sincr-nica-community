import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Star, MapPin, Calendar, Award, ArrowLeft } from '@/components/SmartIcons';
import { Colors, TabThemes } from '@/constants/colors';
import { User } from '@/types/user';

interface UserProfileViewProps {
  user: User;
  onClose: () => void;
}

interface MockAnnouncement {
  id: string;
  type: 'service' | 'event' | 'product';
  title: string;
  description: string;
  price: string;
  date?: string;
  isActive: boolean;
}

const generateMockAnnouncements = (user: User): MockAnnouncement[] => {
  const baseAnnouncements: MockAnnouncement[] = [
    {
      id: '1',
      type: 'service',
      title: 'Sesión de Reiki',
      description: 'Sanación energética personalizada de 60 minutos',
      price: '€45',
      isActive: true,
    },
    {
      id: '2',
      type: 'event',
      title: 'Taller de Mindfulness',
      description: 'Aprende técnicas de meditación y relajación',
      price: '€25',
      date: '15 Nov 2024',
      isActive: true,
    },
    {
      id: '3',
      type: 'service',
      title: 'Coaching Personal',
      description: 'Sesión de coaching para desarrollo personal',
      price: '€60',
      isActive: true,
    },
  ];

  // Customize based on user specialties
  if (user.specialties.includes('Sanación con Sonido')) {
    baseAnnouncements.push({
      id: '4',
      type: 'service',
      title: 'Baño de Sonido',
      description: 'Experiencia relajante con cuencos tibetanos',
      price: '€35',
      isActive: true,
    });
  }

  if (user.specialties.includes('Yoga')) {
    baseAnnouncements.push({
      id: '5',
      type: 'event',
      title: 'Clase de Yoga Matutina',
      description: 'Hatha Yoga para principiantes',
      price: '€15',
      date: 'Lunes y Miércoles',
      isActive: true,
    });
  }

  return baseAnnouncements.slice(0, 4); // Show up to 4 items
};

export function UserProfileView({ user, onClose }: UserProfileViewProps) {
  const router = useRouter();
  const mockAnnouncements = generateMockAnnouncements(user);

  const handleSendMessageButton = () => {
    // Navigate to messages tab with conversation params
    router.push({
      pathname: '/(tabs)/messages',
      params: {
        startConversationWith: user.id.toString(),
        userName: user.name,
        userAvatar: user.avatar,
      }
    });
    onClose(); // Close the profile modal
  };

  const handleAnnouncementPress = (announcement: MockAnnouncement) => {
    Alert.alert(
      announcement.title,
      `${announcement.description}\n\nPrecio: ${announcement.price}${announcement.date ? `\nFecha: ${announcement.date}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: announcement.type === 'service' ? 'Reservar' : 
                announcement.type === 'event' ? 'Apuntarse' : 'Comprar',
          onPress: () => handleReservation(announcement)
        }
      ]
    );
  };

  const handleReservation = (announcement: MockAnnouncement) => {
    const action = announcement.type === 'service' ? 'reserva' : 
                   announcement.type === 'event' ? 'inscripción' : 'compra';
    
    Alert.alert(
      '¡Perfecto!',
      `Tu ${action} para "${announcement.title}" ha sido procesada. ${user.name} se pondrá en contacto contigo pronto.`,
      [
        { text: 'Enviar Mensaje', onPress: () => handleSendMessage(announcement) },
        { text: 'OK' }
      ]
    );
  };

  const handleMoreInfo = (announcement: MockAnnouncement) => {
    Alert.alert(
      `Información detallada`,
      `${announcement.title}\n\n${announcement.description}\n\nPrecio: ${announcement.price}\nProveedor: ${user.name}\nUbicación: ${user.location}${announcement.date ? `\nFecha: ${announcement.date}` : ''}\n\nPara más información o consultas específicas, contacta directamente con ${user.name}.`,
      [
        { text: 'Contactar', onPress: () => handleSendMessage(announcement) },
        { text: 'Cerrar' }
      ]
    );
  };

  const handleSendMessage = (announcement: MockAnnouncement) => {
    Alert.alert(
      'Mensaje enviado',
      `Se ha enviado un mensaje a ${user.name} sobre "${announcement.title}". Te responderá pronto.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#ac8cb3', '#9bdbbf', '#4f8497']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onClose}
            >
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                {user.verified && (
                  <View style={styles.verifiedBadge}>
                    <Award size={16} color={Colors.white} />
                  </View>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.ratingRow}>
                  <Star size={16} color={Colors.gold} fill={Colors.gold} />
                  <Text style={styles.rating}>{user.rating}</Text>
                  <Text style={styles.reviewCount}>({user.reviewCount} reviews)</Text>
                </View>
                <View style={styles.locationRow}>
                  <MapPin size={14} color={Colors.textOnDark} />
                  <Text style={styles.location}>{user.location}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {/* Specialties Section */}
        {user.specialties && user.specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            <View style={styles.specialtiesContainer}>
              {user.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mi Tablero Público Section */}
        {user.isServiceProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Tablero Público</Text>
            <Text style={styles.sectionSubtitle}>Servicios y eventos disponibles</Text>
            <View style={styles.announcementsGrid}>
              {mockAnnouncements.map((announcement) => (
                <TouchableOpacity 
                  key={announcement.id} 
                  style={styles.announcementCard}
                  onPress={() => handleAnnouncementPress(announcement)}
                >
                  <View style={styles.announcementHeader}>
                    <View style={[
                      styles.announcementTypeIcon,
                      { backgroundColor: announcement.type === 'service' ? TabThemes.messages.accentColor + '20' 
                        : announcement.type === 'event' ? Colors.success + '20' 
                        : Colors.accent + '20' }
                    ]}>
                      <Text style={[
                        styles.announcementTypeText,
                        { color: announcement.type === 'service' ? TabThemes.messages.accentColor 
                          : announcement.type === 'event' ? Colors.success 
                          : Colors.accent }
                      ]}>
                        {announcement.type === 'service' ? 'S' : announcement.type === 'event' ? 'E' : 'P'}
                      </Text>
                    </View>
                    <Text style={styles.announcementPrice}>{announcement.price}</Text>
                  </View>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementDescription}>{announcement.description}</Text>
                  {announcement.date && (
                    <Text style={styles.announcementDate}>{announcement.date}</Text>
                  )}
                  
                  {/* Action Button */}
                  <View style={styles.announcementActions}>
                    <TouchableOpacity 
                      style={styles.reserveButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleReservation(announcement);
                      }}
                    >
                      <Text style={styles.reserveButtonText}>
                        {announcement.type === 'service' ? 'Reservar' : 
                         announcement.type === 'event' ? 'Apuntarse' : 'Comprar'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMoreInfo(announcement);
                      }}
                    >
                      <Text style={styles.infoButtonText}>Más Info</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Calendar size={20} color={TabThemes.messages.accentColor} />
              <Text style={styles.statLabel}>Miembro desde</Text>
              <Text style={styles.statValue}>
                {(() => {
                  try {
                    const date = new Date(user.joinedDate);
                    if (isNaN(date.getTime())) {
                      return 'Fecha desconocida';
                    }
                    return date.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                    });
                  } catch (error) {
                    console.warn('UserProfileView: Invalid joinedDate:', user.joinedDate);
                    return 'Fecha desconocida';
                  }
                })()}
              </Text>
            </View>
            {user.isServiceProvider && (
              <View style={styles.statItem}>
                <Award size={20} color={TabThemes.messages.accentColor} />
                <Text style={styles.statLabel}>Proveedor verificado</Text>
                <Text style={styles.statValue}>Servicios profesionales</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSendMessageButton}>
            <Text style={styles.primaryButtonText}>Enviar mensaje</Text>
          </TouchableOpacity>
          {user.isServiceProvider && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Ver servicios</Text>
            </TouchableOpacity>
          )}
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
  scrollContainer: {
    flex: 1,
  },
  headerGradient: {
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textOnDark,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.textOnDark,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textLight,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: TabThemes.messages.accentColor + '15',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: TabThemes.messages.accentColor + '30',
  },
  specialtyText: {
    fontSize: 14,
    color: TabThemes.messages.accentColor,
    fontWeight: '500',
  },
  statsGrid: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: TabThemes.messages.accentColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TabThemes.messages.accentColor,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TabThemes.messages.accentColor,
  },
  announcementsGrid: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  announcementPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  announcementDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: TabThemes.messages.accentColor,
    fontWeight: '500',
  },
  announcementActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reserveButton: {
    flex: 1,
    backgroundColor: TabThemes.messages.accentColor,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  reserveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  infoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: TabThemes.messages.accentColor,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TabThemes.messages.accentColor,
  },
});