import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useLodging } from '@/hooks/lodging-store';
import { useCalendar } from '@/hooks/calendar-store';
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
  Wifi,
  Car,
  Coffee,
  Utensils,
  Tv,
  Wind,
  Bed,
  Bath,
  Home,
  ChevronLeft,
  ChevronRight,
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';

const { width: screenWidth } = Dimensions.get('window');
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function LodgingDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { lodgings: allLodgings } = useLodging();
  const { addToCart } = useCalendar();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(3);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGuestsModal, setShowGuestsModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);

  // Get lodging from store by ID or Title (for deep linking)
  const lodgingId = params.lodgingId as string;
  const lodgingName = params.lodgingName as string;

  const displayLodging = useMemo(() => {
    if (!lodgingId && !lodgingName) return null;
    return allLodgings.find(l =>
      (lodgingId && l.id === lodgingId) ||
      (lodgingName && l.title === lodgingName)
    ) || null;
  }, [lodgingId, lodgingName, allLodgings]);

  if (!displayLodging) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Home size={64} color={Colors.textLight} style={{ marginBottom: 20 }} />
        <Text style={[styles.lodgingTitle, { textAlign: 'center', marginBottom: 12 }]}>
          Alojamiento no encontrado
        </Text>
        <Text style={{ color: Colors.textLight, textAlign: 'center', marginBottom: 24, fontSize: 16 }}>
          No pudimos encontrar los detalles del lugar solicitado.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: Colors.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: Colors.textOnGold, fontWeight: '700', fontSize: 16 }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBooking = () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('Fechas Requeridas', 'Por favor selecciona las fechas de check-in y check-out.');
      return;
    }

    const totalPrice = displayLodging.pricePerNight * nights;

    Alert.alert(
      'Confirmar Reserva',
      `¿Reservar ${nights} ${nights === 1 ? 'noche' : 'noches'} para ${guests} ${guests === 1 ? 'huésped' : 'huéspedes'} por €${totalPrice.toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reservar',
          onPress: () => {
            // Create a calendar event-like object for the cart
            const lodgingEvent = {
              id: `lodging-${lodgingId}-${Date.now()}`,
              title: `Alojamiento: ${displayLodging.title}`,
              description: `${nights} ${nights === 1 ? 'noche' : 'noches'} - ${guests} ${guests === 1 ? 'huésped' : 'huéspedes'}`,
              date: checkInDate.toISOString(),
              startTime: '15:00', // Standard check-in time
              endTime: '11:00', // Standard check-out time
              duration: `${nights} ${nights === 1 ? 'noche' : 'noches'}`,
              location: displayLodging.location || 'Por confirmar',
              price: displayLodging.pricePerNight,
              providerId: displayLodging.hostId,
              provider: {
                id: displayLodging.hostId,
                name: displayLodging.host.name,
                avatar: displayLodging.host.avatar,
              },
              createdBy: displayLodging.host.name,
              category: 'lodging',
              image: displayLodging.images[0] || '',
              isOnline: false,
              capacity: displayLodging.maxGuests,
              attendees: [],
              isPublic: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Add to cart
            addToCart(lodgingEvent.id, nights, lodgingEvent as any);

            Alert.alert(
              '¡Agregado al Carrito!',
              'Tu reserva ha sido agregada al carrito. Procede al pago para confirmar.',
              [
                {
                  text: 'Ver Carrito',
                  onPress: () => router.push('/payment')
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleContactHost = () => {
    Alert.alert(
      'Contactar Anfitrión',
      `¿Deseas contactar con ${displayLodging.host.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Mensaje', onPress: () => router.push('/(tabs)/messages') },
        {
          text: 'Ver Perfil',
          onPress: () => router.push({
            pathname: '/user-profile',
            params: { userName: displayLodging.host.name }
          })
        }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Compartir Alojamiento',
      `Compartir "${displayLodging.title}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => console.log('Sharing lodging...') }
      ]
    );
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      'Favoritos',
      isFavorite ?
        'Alojamiento eliminado de favoritos' :
        'Alojamiento agregado a favoritos'
    );
  };

  const handleViewLocation = () => {
    Alert.alert(
      'Ver Ubicación',
      displayLodging.location,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver en Mapa', onPress: () => console.log('Opening map...') }
      ]
    );
  };

  const handleDateSelection = () => {
    setSelectingCheckIn(true);
    setShowDateModal(true);
  };

  const handleGuestsSelection = () => {
    setShowGuestsModal(true);
  };

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    if (selectingCheckIn) {
      setCheckInDate(date);
      setCheckOutDate(null);
      setSelectingCheckIn(false);
    } else {
      if (checkInDate && date > checkInDate) {
        setCheckOutDate(date);
        const diffTime = Math.abs(date.getTime() - checkInDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
      } else {
        Alert.alert('Error', 'La fecha de salida debe ser posterior a la fecha de entrada');
      }
    }
  };

  const handleSaveDates = () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('Error', 'Por favor selecciona ambas fechas');
      return;
    }
    setShowDateModal(false);
    Alert.alert('¡Fechas Seleccionadas!', `Has seleccionado ${nights} ${nights === 1 ? 'noche' : 'noches'}`);
  };

  const handleResetDates = () => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setSelectingCheckIn(true);
    setNights(3);
  };

  const handleSaveGuests = () => {
    if (guests < 1) {
      Alert.alert('Error', 'Debe haber al menos 1 huésped');
      return;
    }
    if (guests > displayLodging.maxGuests) {
      Alert.alert('Error', `El máximo de huéspedes es ${displayLodging.maxGuests}`);
      return;
    }
    setShowGuestsModal(false);
    Alert.alert('¡Huéspedes Actualizados!', `${guests} ${guests === 1 ? 'huésped' : 'huéspedes'}`);
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableScale
      style={styles.imageItem}
      onPress={() => setSelectedImageIndex(index)}
    >
      <Image source={{ uri: item }} style={styles.thumbnailImage} />
    </TouchableScale>
  );

  const getAmenityIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Wifi, Car, Coffee, Utensils, Tv, Wind, Bed, Bath
    };
    return iconMap[iconName] || Home;
  };

  return (
    <>
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

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: displayLodging.images[selectedImageIndex] }}
            style={styles.mainImage}
          />

          {/* Image Gallery */}
          <FlatList
            data={displayLodging.images}
            renderItem={renderImageItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
            contentContainerStyle={styles.imageGalleryContent}
          />
        </View>

        {/* Lodging Info */}
        <View style={styles.lodgingInfo}>
          {/* Title and Type */}
          <View style={styles.titleSection}>
            <Text style={styles.lodgingTitle}>{displayLodging.title}</Text>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{displayLodging.type}</Text>
            </View>
          </View>

          {/* Capacity and Rating */}
          <View style={styles.capacityRatingSection}>
            <View style={styles.capacityInfo}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.capacityText}>
                {displayLodging.maxGuests} huéspedes
              </Text>
            </View>

            <View style={styles.ratingInfo}>
              <Star size={16} color={Colors.gold} />
              <Text style={styles.ratingText}>{displayLodging.rating}</Text>
              <Text style={styles.reviewCount}>({displayLodging.reviewCount} reseñas)</Text>
            </View>
          </View>

          {/* Location */}
          <TouchableScale
            style={styles.locationSection}
            onPress={handleViewLocation}
          >
            <MapPin size={20} color={Colors.primary} />
            <Text style={styles.locationText}>{displayLodging.location}</Text>
            <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableScale>

          {/* Host Info */}
          <TouchableScale
            style={styles.hostSection}
            onPress={handleContactHost}
          >
            <Image
              source={{ uri: displayLodging.host.avatar }}
              style={styles.hostAvatar}
            />
            <View style={styles.hostInfo}>
              <View style={styles.hostNameRow}>
                <Text style={styles.hostName}>{displayLodging.host.name}</Text>
                {displayLodging.host.verified && (
                  <Award size={16} color={Colors.success} />
                )}
              </View>
              <View style={styles.hostStats}>
                <Text style={styles.hostStat}>Anfitrión verificado</Text>
              </View>
            </View>
            <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableScale>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceInfo}>
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>€{displayLodging.pricePerNight.toFixed(2)}</Text>
              </View>
              <Text style={styles.priceUnit}>por noche</Text>
            </View>

            <View style={styles.selectors}>
              <TouchableScale
                style={styles.dateSelector}
                onPress={handleDateSelection}
              >
                <Calendar size={16} color={Colors.primary} />
                <Text style={styles.dateSelectorText}>
                  {checkInDate && checkOutDate
                    ? `${checkInDate.getDate()} ${MONTHS[checkInDate.getMonth()].substring(0, 3).toLowerCase()} - ${checkOutDate.getDate()} ${MONTHS[checkOutDate.getMonth()].substring(0, 3).toLowerCase()}`
                    : 'Seleccionar fechas'}
                </Text>
              </TouchableScale>

              <TouchableScale
                style={styles.guestsSelector}
                onPress={handleGuestsSelection}
              >
                <Users size={16} color={Colors.primary} />
                <Text style={styles.dateSelectorText}>
                  {guests} {guests === 1 ? 'huésped' : 'huéspedes'}
                </Text>
              </TouchableScale>
            </View>
          </View>

          {/* Booking Summary */}
          <View style={styles.bookingSummary}>
            <Text style={styles.summaryTitle}>Resumen de la estancia</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>€{displayLodging.pricePerNight.toFixed(2)} x {nights} noches</Text>
              <Text style={styles.summaryValue}>€{(displayLodging.pricePerNight * nights).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tarifa de limpieza</Text>
              <Text style={styles.summaryValue}>€15.00</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalValue}>€{(displayLodging.pricePerNight * nights + 15).toFixed(2)}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{displayLodging.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>Servicios y comodidades</Text>
            <View style={styles.amenitiesGrid}>
              {displayLodging.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* TODO: Add highlights, nearby places, rules, detailed ratings when extended lodging data is available */}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableScale
            style={styles.contactButton}
            onPress={handleContactHost}
          >
            <MessageCircle size={20} color={Colors.primary} />
            <Text style={styles.contactButtonText}>Contactar</Text>
          </TouchableScale>

          <TouchableScale
            style={styles.bookButton}
            onPress={handleBooking}
          >
            <Calendar size={20} color={Colors.white} />
            <Text style={styles.bookButtonText}>Reservar</Text>
          </TouchableScale>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDateModal(false)}
        >
          <Pressable
            style={[styles.modalContent, styles.calendarModalContent]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Seleccionar Fechas de Estancia</Text>

            {/* Date selection indicators */}
            <View style={styles.dateSelectionIndicators}>
              <View style={styles.dateIndicator}>
                <Text style={styles.dateIndicatorLabel}>Check-in</Text>
                <Text style={styles.dateIndicatorValue}>
                  {checkInDate ? checkInDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Seleccionar'}
                </Text>
              </View>
              <View style={styles.nightsIndicator}>
                <Text style={styles.nightsValue}>{nights}</Text>
                <Text style={styles.nightsLabel}>{nights === 1 ? 'noche' : 'noches'}</Text>
              </View>
              <View style={styles.dateIndicator}>
                <Text style={styles.dateIndicatorLabel}>Check-out</Text>
                <Text style={styles.dateIndicatorValue}>
                  {checkOutDate ? checkOutDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Seleccionar'}
                </Text>
              </View>
            </View>

            {/* Calendar navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePreviousMonth}>
                <ChevronLeft size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <ChevronRight size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={styles.calendarWeekdays}>
              {WEEKDAYS.map(day => (
                <Text key={day} style={styles.calendarWeekday}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            <ScrollView style={styles.calendarScrollView}>
              <View style={styles.calendarGrid}>
                {calendarDays.map(day => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCheckIn = checkInDate && day.toDateString() === checkInDate.toDateString();
                  const isCheckOut = checkOutDate && day.toDateString() === checkOutDate.toDateString();
                  const isInRange = checkInDate && checkOutDate && day > checkInDate && day < checkOutDate;
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isPast = day < new Date() && !isToday;

                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={[
                        styles.calendarDay,
                        isToday && styles.calendarDayToday,
                        (isCheckIn || isCheckOut) && styles.calendarDaySelected,
                        isInRange && styles.calendarDayInRange,
                        !isCurrentMonth && styles.calendarDayOtherMonth,
                        isPast && styles.calendarDayPast,
                      ]}
                      onPress={() => !isPast && handleDateSelect(day)}
                      disabled={isPast}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          (isCheckIn || isCheckOut) && styles.calendarDayTextSelected,
                          !isCurrentMonth && styles.calendarDayTextOtherMonth,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleResetDates}
              >
                <Text style={styles.modalCancelText}>Reiniciar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveDates}
                disabled={!checkInDate || !checkOutDate}
              >
                <Text style={styles.modalSaveText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Guests Selection Modal */}
      <Modal
        visible={showGuestsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGuestsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGuestsModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Número de Huéspedes</Text>

            <View style={styles.guestsContainer}>
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => setGuests(Math.max(1, guests - 1))}
              >
                <Text style={styles.guestButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.guestsCount}>{guests}</Text>

              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => setGuests(Math.min(displayLodging.maxGuests, guests + 1))}
              >
                <Text style={styles.guestButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.maxGuestsText}>
              Máximo: {displayLodging.maxGuests} huéspedes
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowGuestsModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveGuests}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    backgroundColor: Colors.white,
  },
  mainImage: {
    width: screenWidth,
    height: 250,
    backgroundColor: Colors.secondary,
  },
  imageGallery: {
    marginTop: 12,
  },
  imageGalleryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  imageItem: {
    marginRight: 8,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  lodgingInfo: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lodgingTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 12,
  },
  typeTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  capacityRatingSection: {
    marginBottom: 16,
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  capacityText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 16,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  hostInfo: {
    flex: 1,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  hostStats: {
    flexDirection: 'row',
  },
  hostStat: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceSection: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  priceUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  dateSelectorText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  bookingSummary: {
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
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
  highlightsSection: {
    marginBottom: 20,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 16,
    color: Colors.text,
  },
  amenitiesSection: {
    marginBottom: 20,
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  amenityUnavailable: {
    opacity: 0.5,
  },
  amenityText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  amenityTextUnavailable: {
    color: Colors.textSecondary,
  },
  unavailableLabel: {
    fontSize: 12,
    color: Colors.error,
    fontStyle: 'italic',
  },
  nearbySection: {
    marginBottom: 20,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  nearbyName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  nearbyDistance: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  rulesSection: {
    marginBottom: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 16,
    color: Colors.text,
  },
  ratingsSection: {
    marginBottom: 20,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ratingItem: {
    width: '45%',
    paddingVertical: 8,
  },
  ratingCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  cancellationSection: {
    marginBottom: 20,
  },
  cancellationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
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
  bottomPadding: {
    height: 40,
  },
  selectors: {
    flexDirection: 'row',
    gap: 10,
  },
  guestsSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  guestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginVertical: 30,
  },
  guestButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  guestsCount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
  maxGuestsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  calendarModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    minHeight: 500,
    width: '100%',
  },
  dateSelectionIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dateIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  dateIndicatorLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateIndicatorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  nightsIndicator: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
  },
  nightsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  nightsLabel: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarWeekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calendarScrollView: {
    flexGrow: 0,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDayInRange: {
    backgroundColor: Colors.primary + '20',
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  calendarDayTextOtherMonth: {
    color: Colors.textSecondary,
  },
  modalSaveButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
});