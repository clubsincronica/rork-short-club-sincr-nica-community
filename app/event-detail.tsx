import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
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
  Award,
  CheckCircle,
  Camera,
  User,
  Plus,
  Minus
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';
import { useCalendar } from '@/hooks/calendar-store';
import { allMockUsers } from '@/mocks/data';

const { width: screenWidth } = Dimensions.get('window');

// Mock event data
const mockEvent = {
  id: '1',
  title: 'Taller de Cerámica Tradicional',
  description: 'Aprende las técnicas tradicionales de cerámica en un ambiente acogedor y creativo. Este taller está diseñado tanto para principiantes como para personas con experiencia previa. Incluye todos los materiales y una pieza terminada para llevar a casa.',
  organizer: {
    name: 'Elena Martínez',
    avatar: 'https://via.placeholder.com/60',
    rating: 4.9,
    reviewCount: 83,
    location: 'Madrid, España'
  },
  date: '2024-11-15',
  time: '10:00',
  endTime: '13:00',
  duration: 180, // minutes
  location: 'Estudio de Arte Luna, Calle Mayor 25, Madrid',
  coordinates: { latitude: 40.4168, longitude: -3.7038 },
  price: 35.00,
  originalPrice: 45.00,
  currency: 'EUR',
  images: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1594736797933-d0cab1ff0fce?w=400&h=300&fit=crop'
  ],
  category: 'Taller',
  tags: ['Artesanía', 'Cerámica', 'Arte', 'Manos'],
  maxAttendees: 12,
  currentAttendees: 8,
  requirements: [
    'No se requiere experiencia previa',
    'Ropa cómoda que se pueda ensuciar',
    'Ganas de aprender y crear'
  ],
  includes: [
    'Todos los materiales necesarios',
    'Herramientas de cerámica',
    'Una pieza terminada para llevar',
    'Refrigerios durante el descanso',
    'Certificado de participación'
  ],
  agenda: [
    { time: '10:00', activity: 'Bienvenida y presentación' },
    { time: '10:15', activity: 'Introducción a la cerámica' },
    { time: '10:30', activity: 'Preparación del barro' },
    { time: '11:00', activity: 'Técnicas básicas de modelado' },
    { time: '12:00', activity: 'Descanso con refrigerios' },
    { time: '12:15', activity: 'Finalización de piezas' },
    { time: '13:00', activity: 'Cierre y despedida' }
  ]
};

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { events } = useCalendar();
  
  const [event, setEvent] = useState(mockEvent);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log('Event Detail: Received params:', params);

  useEffect(() => {
    loadEventData();
  }, [params.eventId]);

  const loadEventData = () => {
    try {
      const eventId = params.eventId as string;
      const eventName = params.eventName as string;
      
      console.log('Event Detail: Loading event with ID:', eventId, 'Name:', eventName);
      
      // Find the real event from calendar store
      const realEvent = events.find((e: any) => e.id === eventId || e.title === eventName);
      
      if (realEvent) {
        console.log('Event Detail: ✅ Found real event:', realEvent.title, realEvent.id);
        
        // Find the provider/organizer
        const provider = allMockUsers.find(u => u.id === realEvent.providerId);
        
        // Transform real event to expected format
        const transformedEvent = {
          id: realEvent.id,
          title: realEvent.title,
          description: realEvent.description || 'Descripción del evento',
          organizer: {
            name: provider?.name || realEvent.provider?.name || 'Organizador',
            avatar: provider?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            rating: provider?.rating || 4.8,
            reviewCount: provider?.reviewCount || 50,
            location: provider?.location || realEvent.location || 'Ubicación'
          },
          date: realEvent.date,
          time: realEvent.startTime,
          endTime: realEvent.endTime,
          duration: 120, // Default duration in minutes
          location: realEvent.location || 'Por definir',
          coordinates: { latitude: 40.4168, longitude: -3.7038 },
          price: realEvent.price || 0,
          originalPrice: realEvent.price || 0,
          currency: 'EUR',
          category: realEvent.category || 'Evento',
          tags: realEvent.tags || [],
          maxAttendees: realEvent.maxParticipants || 10,
          currentAttendees: realEvent.currentParticipants || 0,
          requirements: [
            'No se requiere experiencia previa',
            'Ganas de participar',
          ],
          includes: [
            'Experiencia completa',
            'Material incluido si es necesario',
          ],
          agenda: [
            { time: realEvent.startTime || '10:00', activity: 'Inicio del evento' },
            { time: realEvent.endTime || '12:00', activity: 'Cierre del evento' }
          ],
          images: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop'
          ]
        };
        
        setEvent(transformedEvent as any);
      } else {
        console.log('Event Detail: ⚠️ Event not found, using mock data');
        // Keep using mock event as fallback
      }
    } catch (error) {
      console.error('Event Detail: Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = () => {
    if (isRegistered) {
      Alert.alert(
        'Cancelar Inscripción',
        '¿Estás seguro de que quieres cancelar tu inscripción?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Sí, cancelar', 
            style: 'destructive',
            onPress: () => {
              setIsRegistered(false);
              Alert.alert('Cancelado', 'Tu inscripción ha sido cancelada.');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Confirmar Inscripción',
        `¿Inscribir ${attendeeCount} ${attendeeCount === 1 ? 'persona' : 'personas'} por €${(event.price * attendeeCount).toFixed(2)}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Inscribir', 
            onPress: () => {
              setIsRegistered(true);
              Alert.alert('¡Inscrito!', 'Te has inscrito exitosamente al evento.');
              router.push('/calendar');
            }
          }
        ]
      );
    }
  };

  const handleContactOrganizer = () => {
    Alert.alert(
      'Contactar Organizador',
      `¿Deseas contactar con ${event.organizer.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Mensaje', onPress: () => router.push('/(tabs)/messages') },
        { 
          text: 'Ver Perfil', 
          onPress: () => router.push({
            pathname: '/user-profile',
            params: { userName: event.organizer.name }
          })
        }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Compartir Evento',
      `Compartir "${event.title}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => console.log('Sharing event...') }
      ]
    );
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      'Favoritos',
      isFavorite ? 
        'Evento eliminado de favoritos' : 
        'Evento agregado a favoritos'
    );
  };

  const handleViewLocation = () => {
    Alert.alert(
      'Ver Ubicación',
      event.location,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver en Mapa', onPress: () => console.log('Opening map...') }
      ]
    );
  };

  const incrementAttendees = () => {
    if (attendeeCount < (event.maxAttendees - event.currentAttendees)) {
      setAttendeeCount(attendeeCount + 1);
    }
  };

  const decrementAttendees = () => {
    if (attendeeCount > 1) {
      setAttendeeCount(attendeeCount - 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const availableSpots = event.maxAttendees - event.currentAttendees;

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
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

      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: event.images[selectedImageIndex] }}
          style={styles.mainImage}
        />
        
        <View style={styles.imageIndicators}>
          {event.images.map((_, index) => (
            <TouchableScale
              key={index}
              style={[
                styles.imageIndicator,
                selectedImageIndex === index && styles.imageIndicatorActive
              ]}
              onPress={() => setSelectedImageIndex(index)}
            >
              <View />
            </TouchableScale>
          ))}
        </View>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        {/* Title and Category */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.dateTimeSection}>
          <View style={styles.dateTimeItem}>
            <Calendar size={20} color={Colors.primary} />
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateText}>{formatDate(event.date)}</Text>
              <Text style={styles.timeText}>{event.time} - {event.endTime}</Text>
            </View>
          </View>
          
          <View style={styles.dateTimeItem}>
            <Clock size={20} color={Colors.primary} />
            <Text style={styles.durationText}>{event.duration} minutos</Text>
          </View>
        </View>

        {/* Location */}
        <TouchableScale 
          style={styles.locationSection}
          onPress={handleViewLocation}
        >
          <MapPin size={20} color={Colors.primary} />
          <Text style={styles.locationText}>{event.location}</Text>
          <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableScale>

        {/* Organizer */}
        <TouchableScale 
          style={styles.organizerSection}
          onPress={handleContactOrganizer}
        >
          <Image 
            source={{ uri: event.organizer.avatar }}
            style={styles.organizerAvatar}
          />
          <View style={styles.organizerInfo}>
            <Text style={styles.organizerName}>{event.organizer.name}</Text>
            <View style={styles.organizerRating}>
              <Star size={16} color={Colors.gold} />
              <Text style={styles.ratingText}>{event.organizer.rating}</Text>
              <Text style={styles.reviewCount}>({event.organizer.reviewCount} reseñas)</Text>
            </View>
          </View>
          <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableScale>

        {/* Price and Attendance */}
        <View style={styles.priceAttendanceSection}>
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>€{event.price.toFixed(2)}</Text>
            {event.originalPrice > event.price && (
              <Text style={styles.originalPrice}>€{event.originalPrice.toFixed(2)}</Text>
            )}
            <Text style={styles.priceLabel}>por persona</Text>
          </View>
          
          <View style={styles.attendanceSection}>
            <Users size={18} color={Colors.primary} />
            <Text style={styles.attendanceText}>
              {event.currentAttendees}/{event.maxAttendees} inscritos
            </Text>
            <Text style={styles.spotsText}>
              ({availableSpots} {availableSpots === 1 ? 'lugar disponible' : 'lugares disponibles'})
            </Text>
          </View>
        </View>

        {/* Attendee Selector */}
        {!isRegistered && (
          <View style={styles.attendeeSelector}>
            <View style={styles.attendeeSelectorRow}>
              <Text style={styles.attendeeLabel}>Número de personas:</Text>
              <View style={styles.attendeeControls}>
                <TouchableScale 
                  style={[styles.attendeeButton, attendeeCount <= 1 && styles.attendeeButtonDisabled]}
                  onPress={decrementAttendees}
                  disabled={attendeeCount <= 1}
                >
                  <Minus size={16} color={attendeeCount <= 1 ? Colors.textSecondary : Colors.text} />
                </TouchableScale>
                
                <Text style={styles.attendeeCount}>{attendeeCount}</Text>
                
                <TouchableScale 
                  style={[styles.attendeeButton, attendeeCount >= availableSpots && styles.attendeeButtonDisabled]}
                  onPress={incrementAttendees}
                  disabled={attendeeCount >= availableSpots}
                >
                  <Plus size={16} color={attendeeCount >= availableSpots ? Colors.textSecondary : Colors.text} />
                </TouchableScale>
              </View>
            </View>
            <Text style={styles.totalPrice}>Total: €{(event.price * attendeeCount).toFixed(2)}</Text>
          </View>
        )}

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {event.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {/* What's Included */}
        <View style={styles.includesSection}>
          <Text style={styles.sectionTitle}>¿Qué incluye?</Text>
          {event.includes.map((item, index) => (
            <View key={index} style={styles.includeItem}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <View style={styles.requirementsSection}>
          <Text style={styles.sectionTitle}>Requisitos</Text>
          {event.requirements.map((requirement, index) => (
            <View key={index} style={styles.requirementItem}>
              <CheckCircle size={16} color={Colors.primary} />
              <Text style={styles.requirementText}>{requirement}</Text>
            </View>
          ))}
        </View>

        {/* Agenda */}
        <View style={styles.agendaSection}>
          <Text style={styles.sectionTitle}>Programa del día</Text>
          {event.agenda.map((item, index) => (
            <View key={index} style={styles.agendaItem}>
              <Text style={styles.agendaTime}>{item.time}</Text>
              <Text style={styles.agendaActivity}>{item.activity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableScale
          style={styles.contactButton}
          onPress={handleContactOrganizer}
        >
          <MessageCircle size={20} color={Colors.primary} />
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableScale>

        <TouchableScale
          style={[
            styles.rsvpButton,
            isRegistered && styles.cancelButton
          ]}
          onPress={handleRSVP}
        >
          <User size={20} color={Colors.white} />
          <Text style={styles.rsvpButtonText}>
            {isRegistered ? 'Cancelar Inscripción' : 'Inscribirse'}
          </Text>
        </TouchableScale>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    width: screenWidth,
    height: 250,
    backgroundColor: Colors.secondary,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: Colors.white,
  },
  eventInfo: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 12,
  },
  categoryTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  dateTimeSection: {
    marginBottom: 16,
    gap: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  durationText: {
    fontSize: 14,
    color: Colors.text,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 16,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  organizerRating: {
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
  priceAttendanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  priceSection: {
    alignItems: 'flex-start',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  attendanceSection: {
    alignItems: 'flex-end',
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  spotsText: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  attendeeSelector: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
  },
  attendeeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attendeeLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  attendeeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  attendeeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeButtonDisabled: {
    backgroundColor: Colors.background,
  },
  attendeeCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '30',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  includesSection: {
    marginBottom: 20,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  includeText: {
    fontSize: 16,
    color: Colors.text,
  },
  requirementsSection: {
    marginBottom: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 16,
    color: Colors.text,
  },
  agendaSection: {
    marginBottom: 20,
  },
  agendaItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  agendaTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    width: 60,
  },
  agendaActivity: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
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
  rsvpButton: {
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
  cancelButton: {
    backgroundColor: Colors.error,
  },
  rsvpButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});