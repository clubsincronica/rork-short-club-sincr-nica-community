import React, { useState, useEffect } from 'react';
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
  Clock,
  Users,
  Heart,
  Share,
  BookOpen,
  Award,
  CheckCircle,
  Camera,
  Euro
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';
// import { mockServices, allMockUsers } from '@/mocks/data';
import { Service } from '@/types/user';
import { ServiceReservationModal } from '@/components/ServiceReservationModal';
import { useCalendar } from '@/hooks/calendar-store';
import { useServices } from '@/hooks/services-store';
import { useUser } from '@/hooks/user-store';

export default function ServiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { services: realServices } = useServices();
  const { currentUser } = useUser();
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);

  const { addEvent, createReservation } = useCalendar();

  useEffect(() => {
    console.log('Service Detail: Received params:', params);
    loadServiceDetail();
  }, [params.serviceId]);

  const loadServiceDetail = () => {
    try {
      setLoading(true);

      const serviceId = params.serviceId as string;
      const serviceName = params.serviceName as string;

      console.log('Service Detail: Loading service with ID:', serviceId, 'Name:', serviceName);

      // First, check real services from the store
      let foundService: any = realServices.find(s => s.id === serviceId);

      if (foundService) {
        console.log('Service Detail: ✅ Found real service:', foundService.title, foundService.id);
      }

      if (foundService) {
        setService(foundService);

        // Find the service provider
        let serviceProvider;

        // For real services, find the actual user
        // In a real app we'd fetch the user from API if we only have ID
        if (foundService.providerId) {
          if (currentUser && foundService.providerId === currentUser.id) {
            serviceProvider = currentUser;
          }
        }

        // If we have an embedded provider object, use it
        if (!serviceProvider && foundService.provider) {
          serviceProvider = foundService.provider;
        }

        if (serviceProvider) {
          console.log('Service Detail: ✅ Found provider:', serviceProvider.name, serviceProvider.id);
          setProvider(serviceProvider);
        } else {
          console.log('Service Detail: ⚠️ No provider found for service');
        }
      } else {
        console.log('Service Detail: ❌ Service not found');
      }
    } catch (error) {
      console.error('Error loading service detail:', error);
      Alert.alert('Error', 'No se pudo cargar los detalles del servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (service) {
      setShowReservationModal(true);
    } else {
      Alert.alert('Error', 'No se pudo cargar el servicio');
    }
  };

  const handleContactProvider = () => {
    if (provider) {
      router.push({
        pathname: '/user-profile',
        params: {
          userId: provider.id,
          userName: provider.name
        }
      });
    } else {
      Alert.alert(
        'Contactar',
        `¿Deseas contactar con ${service?.provider}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Mensaje', onPress: () => router.push('/(tabs)/messages') }
        ]
      );
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Compartir Servicio',
      `Compartir "${service?.title}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => console.log('Sharing service...') }
      ]
    );
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      'Favoritos',
      isFavorite ?
        'Servicio eliminado de favoritos' :
        'Servicio agregado a favoritos'
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando servicio...</Text>
        </View>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableScale
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableScale>

        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Servicio no encontrado</Text>
          <Text style={styles.notFoundText}>
            No se pudo encontrar el servicio solicitado
          </Text>
          <TouchableScale
            style={styles.backToServicesButton}
            onPress={() => router.push('/(tabs)/services')}
          >
            <Text style={styles.backToServicesText}>Ver Todos los Servicios</Text>
          </TouchableScale>
        </View>
      </View>
    );
  }

  const serviceImages = [
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop'
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ paddingTop: insets.top, flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableScale
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableScale>

          <View style={styles.headerActions}>
            <TouchableScale
              style={styles.headerButton}
              onPress={handleFavorite}
            >
              <Heart size={24} color={Colors.white} fill={isFavorite} />
            </TouchableScale>

            <TouchableScale
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Share size={24} color={Colors.white} />
            </TouchableScale>
          </View>
        </View>

        {/* Service Images */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: serviceImages[selectedImage] }}
            style={styles.mainImage}
          />

          <View style={styles.imageIndicator}>
            {serviceImages.map((_, index) => (
              <TouchableScale
                key={index}
                style={[
                  styles.imageIndicatorDot,
                  selectedImage === index && styles.imageIndicatorDotActive
                ]}
                onPress={() => setSelectedImage(index)}
              >
                <View />
              </TouchableScale>
            ))}
          </View>

          <TouchableScale style={styles.cameraButton}>
            <Camera size={20} color={Colors.white} />
          </TouchableScale>
        </View>

        {/* Service Info Card */}
        <View style={styles.infoCard}>
          {/* Title and Price */}
          <View style={styles.titleSection}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <View style={styles.priceContainer}>
              <Euro size={20} color={Colors.success} />
              <Text style={styles.servicePrice}>{service.price}</Text>
              <Text style={styles.pricePeriod}>/hora</Text>
            </View>
          </View>

          {/* Provider Info */}
          <TouchableScale
            style={styles.providerSection}
            onPress={handleContactProvider}
          >
            <Image
              source={{ uri: provider?.avatar || 'https://via.placeholder.com/50' }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider?.name || service.provider.name}</Text>
              <View style={styles.providerRating}>
                <Star size={16} color={Colors.gold} />
                <Text style={styles.ratingText}>0.0</Text>
                <Text style={styles.reviewCount}>(0 reseñas)</Text>
              </View>
            </View>
            <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableScale>

          {/* Service Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <Clock size={18} color={Colors.primary} />
              <Text style={styles.detailText}>Duración: 1-2 horas</Text>
            </View>

            <View style={styles.detailItem}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.detailText}>
                {service.location || params.serviceLocation || 'Madrid, España'}
              </Text>
              {params.distance && (
                <Text style={styles.distanceText}>• {params.distance} km</Text>
              )}
            </View>

            <View style={styles.detailItem}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.detailText}>Disponible para grupos pequeños</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Incluido en el servicio</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.featureText}>Consulta personalizada</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.featureText}>Material incluido</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.featureText}>Seguimiento post-servicio</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.featureText}>Garantía de satisfacción</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>
              {service.description || `Servicio profesional de ${service.title.toLowerCase()} con años de experiencia. Ofrecemos un servicio personalizado y de alta calidad, adaptado a las necesidades especiales de cada cliente.`}
            </Text>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reseñas</Text>
            </View>

            <View style={styles.reviewItem}>
              <Text style={[styles.reviewText, { textAlign: 'center', fontStyle: 'italic' }]}>
                No hay reseñas todavía.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableScale
            style={styles.contactButton}
            onPress={handleContactProvider}
          >
            <MessageCircle size={20} color={Colors.primary} />
            <Text style={styles.contactButtonText}>Contactar</Text>
          </TouchableScale>

          <TouchableScale
            style={styles.bookButton}
            onPress={handleBookService}
          >
            <Calendar size={20} color={Colors.white} />
            <Text style={styles.bookButtonText}>Reservar</Text>
          </TouchableScale>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ServiceReservationModal
        visible={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
        }}
        service={service}
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
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backToServicesButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToServicesText: {
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.surface,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorDotActive: {
    backgroundColor: Colors.white,
  },
  cameraButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
    marginLeft: 4,
  },
  pricePeriod: {
    fontSize: 14,
    color: Colors.success,
    marginLeft: 2,
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 20,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  reviewsSection: {
    marginBottom: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  reviewItem: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  contactButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  bottomPadding: {
    height: 40,
  },
});