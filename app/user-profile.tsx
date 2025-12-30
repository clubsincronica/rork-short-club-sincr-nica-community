import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Award,
  Users,
  Heart,
  Share2,
  MoreHorizontal,
  QrCode,
  Instagram,
  Facebook,
  Tiktok
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';
import { ProfilePriorityBoard } from '@/components/ProfilePriorityBoard';
import { useServices } from '@/hooks/services-store';
import { useCalendar } from '@/hooks/calendar-store';
import { useProducts } from '@/hooks/products-store';
import { useUser } from '@/hooks/user-store';
import { User, Service } from '@/types/user';
import { ServiceReservationModal } from '@/components/ServiceReservationModal';
import { TicketWallet } from '@/components/TicketWallet';
import { ImageViewerModal } from '@/components/ImageViewerModal';

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showTicketWallet, setShowTicketWallet] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Check if this is own profile preview (hide action buttons)
  const isOwnProfile = params.isOwnProfile === 'true';

  // For own profile preview, we need to get current user from user store
  const { currentUser: storeCurrentUser } = useUser();

  // Helper function to convert social media handles to URLs
  const getSocialMediaUrl = (platform: 'instagram' | 'facebook' | 'tiktok', value: string): string => {
    if (!value) return '';

    // If already a URL, return as is
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    // Remove @ symbol if present
    const cleanValue = value.replace('@', '').trim();

    // Convert to URL based on platform
    switch (platform) {
      case 'instagram':
        return `https://www.instagram.com/${cleanValue}`;
      case 'facebook':
        return `https://www.facebook.com/${cleanValue}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${cleanValue}`;
      default:
        return value;
    }
  };

  // Store hooks for getting user content
  const { services } = useServices();
  const { events, addEvent, createReservation } = useCalendar();
  const { products, getUserProducts } = useProducts();

  // Create user offerings array similar to Mi Tablero
  const userOfferings = useMemo(() => {
    if (!user) return [];

    console.log(`User Profile: Creating offerings for ${user.name} (ID: ${user.id})`);
    console.log(`User Profile: Available services count: ${services.length}`);
    console.log(`User Profile: Available events count: ${events.length}`);

    const offerings: any[] = [];

    // 1. Add user services (from store only) - STRICT ID-BASED FILTERING ONLY
    const userServices = services.filter(service =>
      String(service.providerId) === String(user.id)
    );

    console.log(`User Profile: Found ${userServices.length} real services for ${user.name}`);

    userServices.forEach((service: any) => console.log(`- Service: ${service.title}`));

    userServices.forEach(service => {
      offerings.push({
        id: service.id,
        type: 'service',
        title: service.title,
        description: service.description,
        price: service.price,
        image: service.images?.[0],
        priority: 1,
        isActive: true, // Default to active since Service type doesn't have isActive
        createdAt: new Date().toISOString(), // Service type doesn't have createdAt
        updatedAt: new Date().toISOString(),
        tags: service.tags || [],
        metadata: {
          category: service.category,
          duration: service.duration,
          isOnline: service.isOnline
        }
      });
    });

    // 2. Add user events - STRICT FILTERING ONLY
    const userEvents = events.filter((event: any) => {
      // Only include events where providerId matches AND no provider object exists OR provider.id also matches
      const providerIdMatches = String(event.providerId) === String(user.id);
      const providerObjMatches = !event.provider || String(event.provider.id) === String(user.id);
      return providerIdMatches && providerObjMatches;
    });

    console.log(`User Profile: Found ${userEvents.length} events for ${user.name}`);
    userEvents.forEach((event: any) => console.log(`- Event: ${event.title}`));

    userEvents.forEach((event: any) => {
      offerings.push({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        price: event.price,
        image: event.image,
        priority: 1,
        isActive: true,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        metadata: {
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          maxParticipants: event.maxParticipants,
          currentParticipants: event.currentParticipants,
          isOnline: event.isOnline
        }
      });
    });

    // 3. Add user products
    const realUserProducts = getUserProducts(String(user.id));
    console.log(`User Profile: Found ${realUserProducts.length} products for ${user.name}`);
    realUserProducts.forEach((product: any) => console.log(`- Product: ${product.title}`));

    realUserProducts.forEach(product => {
      offerings.push({
        id: product.id,
        type: 'product',
        title: product.title,
        description: product.description,
        price: product.price,
        image: product.images?.[0],
        priority: 1,
        isActive: (product as any).inStock ?? true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        tags: product.tags,
        metadata: {
          category: product.category,
          createdAt: product.createdAt
        }
      });
    });

    console.log(`User Profile: Total offerings for ${user.name}: ${offerings.length}`);
    return offerings;
  }, [user, services, events, products]);

  useEffect(() => {
    loadUserProfile();
  }, [params.userId, isOwnProfile, storeCurrentUser]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // If this is own profile preview, use current user from store
      if (isOwnProfile && storeCurrentUser) {
        console.log('User Profile: Loading own profile preview for:', storeCurrentUser.name, storeCurrentUser.id);
        setUser(storeCurrentUser);

        // Find real services for current user
        const userServicesFromStore = services.filter(service =>
          String(service.providerId) === String(storeCurrentUser.id)
        );

        setUserServices(userServicesFromStore as any);
        setLoading(false);
        return;
      }

      const userId = params.userId as string;
      const userName = params.userName as string;

      // 1. Try to fetch from API first (Real Data)
      if (userId) {
        try {
          // Import getApiBaseUrl dynamically or assume it's available. 
          // Better to import it at top of file, but for now we can rely on relative import if we add it.
          // Note: using relative, but we need to add import to top of file
          const { getApiBaseUrl } = require('@/utils/api-config');
          const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}`);

          if (response.ok) {
            const userData = await response.json();
            // Parse JSON fields if needed (though backend usually handles this now)
            if (typeof userData.interests === 'string') userData.interests = JSON.parse(userData.interests);
            if (typeof userData.services === 'string') userData.services = JSON.parse(userData.services);

            console.log('User Profile: Loaded real user from API:', userData.name);
            setUser(userData);

            // Use real services
            const userServicesFromStore = services.filter(service =>
              String(service.providerId) === String(userData.id)
            );
            setUserServices(userServicesFromStore as any);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log('API fetch failed, trying mock data...', apiError);
        }
      }

      // 2. If not found in API, user is not found
      console.log('User Profile: User not found in API');
      setUser(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (user?.phone) {
      Linking.openURL(`tel:${user.phone}`);
    } else {
      Alert.alert('Info', 'Número de teléfono no disponible');
    }
  };

  const handleMessage = () => {
    if (user) {
      // Navigate to messages tab with user data to start conversation
      router.push({
        pathname: '/(tabs)/messages',
        params: {
          startConversationWith: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          userBio: user.bio
        }
      });
    }
  };

  const handleEmail = () => {
    if (user?.email) {
      Linking.openURL(`mailto:${user.email}`);
    } else {
      Alert.alert('Info', 'Email no disponible');
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      'Seguimiento',
      isFollowing ?
        `Has dejado de seguir a ${user?.name}` :
        `Ahora sigues a ${user?.name}`
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Compartir Perfil',
      `Compartir el perfil de ${user?.name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => console.log('Sharing profile...') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableScale
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableScale>

        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Usuario no encontrado</Text>
          <Text style={styles.notFoundText}>
            No se pudo encontrar el perfil solicitado
          </Text>
          <TouchableScale
            style={styles.backToNearMeButton}
            onPress={() => router.push('/(tabs)/near-me')}
          >
            <Text style={styles.backToNearMeText}>Volver a Cerca de Ti</Text>
          </TouchableScale>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ paddingTop: insets.top, flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableScale
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableScale>

          <TouchableScale
            style={styles.moreButton}
            onPress={handleShare}
          >
            <Share2 size={24} color={Colors.white} />
          </TouchableScale>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.profileCard}
        >
          <View style={styles.profileContent}>
            {/* Profile Image */}
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() => setShowImageViewer(true)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: user.avatar || 'https://via.placeholder.com/120' }}
                style={styles.profileImage}
              />
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>

            {/* User Info */}
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userTitle}>{user.specialties?.[0] || 'Miembro de la comunidad'}</Text>

            {/* Location or Social Links */}
            {isOwnProfile ? (
              <View style={styles.socialLinksContainer}>
                {user.instagram && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(getSocialMediaUrl('instagram', user.instagram || ''))}
                  >
                    <Instagram size={24} color={Colors.white} />
                  </TouchableOpacity>
                )}
                {user.facebook && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(getSocialMediaUrl('facebook', user.facebook || ''))}
                  >
                    <Facebook size={24} color={Colors.white} />
                  </TouchableOpacity>
                )}
                {user.tiktok && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => Linking.openURL(getSocialMediaUrl('tiktok', user.tiktok || ''))}
                  >
                    <Tiktok size={24} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.locationContainer}>
                <MapPin size={16} color={Colors.white} />
                <Text style={styles.locationText}>
                  {user.location || params.userLocation || 'Madrid, España'}
                </Text>
                {params.distance && (
                  <Text style={styles.distanceText}>• {params.distance} km</Text>
                )}
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userOfferings.length}</Text>
                <Text style={styles.statLabel}>Contenido</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Star size={16} color={Colors.gold} />
                <Text style={styles.statNumber}>{user.rating || '0.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons - Hidden for own profile preview */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableScale
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleMessage}
            >
              <MessageCircle size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Mensaje</Text>
            </TouchableScale>

            <TouchableScale
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleCall}
            >
              <Phone size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Llamar</Text>
            </TouchableScale>

            <TouchableScale
              style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Heart size={20} color={isFollowing ? Colors.white : Colors.primary} fill={isFollowing} />
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Text>
            </TouchableScale>
          </View>
        )}

        {/* Own Profile Actions - Shown only for own profile */}
        {isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableScale
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setShowTicketWallet(true)}
            >
              <QrCode size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Mis Tickets</Text>
            </TouchableScale>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.aboutText}>
            {user.bio || `Hola, soy ${user.name}. Me especializo en ${user.specialties?.[0] || 'varios servicios'} y me encanta ayudar a la comunidad. ¡Contáctame para cualquier consulta!`}
          </Text>
        </View>

        {/* Content Section - Using same sliding cards as Mi Tablero */}
        {userOfferings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Contenido ({userOfferings.length})
            </Text>
            <ProfilePriorityBoard
              items={userOfferings}
              isEditing={false}
              customization={{
                showBio: false,
                showSpecialties: false,
                showInterests: false,
                showRating: true,
                showLocation: false,
                showPriorityBoard: true,
                priorityBoardTitle: "Contenido",
                theme: 'light',
                maxPriorityItems: 20
              }}
              onItemPress={(item) => {
                if (item.type === 'service') {
                  // Show reservation options for services
                  Alert.alert(
                    item.title,
                    '¿Qué te gustaría hacer?',
                    [
                      {
                        text: 'Ver detalles',
                        onPress: () => router.push({
                          pathname: '/service-detail',
                          params: {
                            serviceId: item.id,
                            serviceName: item.title
                          }
                        })
                      },
                      {
                        text: 'Reservar ahora',
                        onPress: () => {
                          // Find the full service object
                          const fullService = userServices.find(s => s.id === item.id);
                          if (fullService) {
                            setSelectedService(fullService);
                            setShowReservationModal(true);
                          }
                        }
                      },
                      {
                        text: 'Cancelar',
                        style: 'cancel'
                      }
                    ]
                  );
                } else if (item.type === 'event') {
                  router.push({
                    pathname: '/event-detail',
                    params: {
                      eventId: item.id,
                      eventName: item.title
                    }
                  });
                } else if (item.type === 'product') {
                  router.push({
                    pathname: '/product-detail',
                    params: {
                      productId: item.id,
                      productName: item.title
                    }
                  });
                }
              }}
            />
          </View>
        )}

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          {user.phone && (
            <TouchableScale style={styles.contactItem} onPress={handleCall}>
              <Phone size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{user.phone}</Text>
            </TouchableScale>
          )}

          {user.email && (
            <TouchableScale style={styles.contactItem} onPress={handleEmail}>
              <Mail size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{user.email}</Text>
            </TouchableScale>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ServiceReservationModal
        visible={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />

      {/* Ticket Wallet Modal - Only show for own profile */}
      {isOwnProfile && (
        <TicketWallet
          visible={showTicketWallet}
          onClose={() => setShowTicketWallet(false)}
        />
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewer}
        imageUri={user?.avatar || 'https://via.placeholder.com/120'}
        onClose={() => setShowImageViewer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  backToNearMeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToNearMeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileContent: {
    padding: 24,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  distanceText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followingButton: {
    backgroundColor: Colors.primary,
  },
  followButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: Colors.white,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
  },
  serviceCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceRatingText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: Colors.text,
  },
  bottomPadding: {
    height: 40,
  },
});