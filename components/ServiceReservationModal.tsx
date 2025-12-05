import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { X, Calendar, Clock, Users, Check, ShoppingCart } from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { useCalendar } from '@/hooks/calendar-store';
import { router } from 'expo-router';

interface ServiceReservationModalProps {
  visible: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    duration: number;
    location?: string;
    providerId?: string; // Add providerId
    provider?: {
      name: string;
      avatar?: string;
      id?: string; // Add provider id
    };
    rating?: number;
    reviewCount?: number;
    isOnline?: boolean;
  } | null;
}

const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export function ServiceReservationModal({ 
  visible, 
  onClose, 
  service
}: ServiceReservationModalProps) {
  const { addToCart, events, addEvent, cart } = useCalendar();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Generate available dates with simple time slots
  const availableDates = useMemo(() => {
    if (!service) {
      return [];
    }

    const dates: Array<{
      date: string;
      dayName: string;
      slots: Array<{
        startTime: string;
        endTime: string;
        available: boolean;
      }>;
    }> = [];

    const currentDate = new Date();
    
    // Generate simple time slots for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      
      const dayOfWeek = date.getDay();
      // Skip Sundays for simplicity (you can modify this)
      if (dayOfWeek === 0) continue;

      // Generate morning and afternoon slots
      const morningSlots = [
        { startTime: '09:00', endTime: '10:30', available: true },
        { startTime: '11:00', endTime: '12:30', available: true },
      ];
      
      const afternoonSlots = [
        { startTime: '14:00', endTime: '15:30', available: Math.random() > 0.3 },
        { startTime: '16:00', endTime: '17:30', available: Math.random() > 0.2 },
        { startTime: '18:00', endTime: '19:30', available: Math.random() > 0.4 },
      ];

      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: DAYS_OF_WEEK[dayOfWeek],
        slots: [...morningSlots, ...afternoonSlots]
      });
    }

    return dates;
  }, [service]);

  const selectedDateData = availableDates.find(d => d.date === selectedDate);

  const handleReserve = async () => {
    if (!selectedDate || !selectedSlot || !service) {
      Alert.alert('Error', 'Por favor selecciona una fecha y horario');
      return;
    }

    setIsBooking(true);
    
    try {
      // Find or create the event for this service slot
      const eventId = `service-slot-${service.id}-${selectedDate}-${selectedSlot.startTime}`;
      let existingEvent = events.find((e: any) => e.id === eventId);
      
      let finalEvent = existingEvent;
      
      if (!existingEvent) {
        // Create a new event for this service slot
        // Don't set ID - let addEvent generate it
        const serviceProviderId = service.providerId || service.provider?.id || 'unknown';
        
        const newEvent = {
          title: service.title,
          description: service.description || '',
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          location: service.location || '',
          isOnline: service.isOnline || false,
          maxParticipants: 1,
          currentParticipants: 0,
          price: service.price,
          category: 'otros' as any,
          providerId: serviceProviderId, // Use the actual provider ID
          tags: ['service-slot', `serviceId:${service.id}`],
          duration: service.duration.toString(),
          createdBy: serviceProviderId, // Use the actual provider ID
          isServiceSlot: true,
          serviceId: service.id,
          provider: service.provider, // Pass the full provider object
        };
        
        console.log('📝 Adding new event to calendar');
        console.log('📝 Service providerId:', service.providerId);
        console.log('📝 Service provider.id:', service.provider?.id);
        console.log('📝 Using providerId:', serviceProviderId);
        console.log('📝 Event provider name:', service.provider?.name);
        // Add event to calendar - this will generate a proper ID
        const addedEvent = await addEvent(newEvent);
        if (addedEvent) {
          finalEvent = addedEvent;
          console.log('✅ Event added successfully with ID:', addedEvent.id);
          console.log('✅ Event provider:', addedEvent.provider?.name);
        } else {
          throw new Error('Failed to add event');
        }
      } else {
        console.log('✅ Found existing event:', existingEvent.id);
      }
      
      if (!finalEvent || !finalEvent.id) {
        throw new Error('Failed to create event');
      }
      
      // Add to cart with the event object directly (no need to wait for state update)
      console.log('🛒 Adding to cart:', finalEvent.id);
      console.log('🛒 Cart before adding:', cart.length);
      await addToCart(finalEvent.id, 1, finalEvent);
      console.log('✅ Successfully added to cart');
      console.log('🛒 Cart after adding should be:', cart.length + 1);
      
      // Show checkout modal
      setShowCheckoutModal(true);
      setIsBooking(false);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      Alert.alert('Error', 'No se pudo agregar al carrito. Inténtalo de nuevo.');
      setIsBooking(false);
    }
  };

  const handleCheckoutNow = () => {
    setShowCheckoutModal(false);
    onClose();
    setSelectedDate('');
    setSelectedSlot(null);
    // Navigate to cart in Profile tab
    router.push('/payment');
  };

  const handleContinueShopping = () => {
    setShowCheckoutModal(false);
    onClose();
    setSelectedDate('');
    setSelectedSlot(null);
    Alert.alert(
      '✅ Agregado al Carrito',
      'El servicio ha sido agregado a tu carrito. Puedes continuar explorando o ir a tu carrito para finalizar la compra.'
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    });
  };

  if (!service) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>📅 Reservar Cita</Text>
          <TouchableOpacity 
            onPress={handleReserve} 
            style={[
              styles.reserveButton,
              (!selectedDate || !selectedSlot) && styles.reserveButtonDisabled
            ]}
            disabled={!selectedDate || !selectedSlot}
          >
            <Check size={24} color={(!selectedDate || !selectedSlot) ? Colors.textLight : Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Service Info */}
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceDetail}>💰 ${service.price}</Text>
              <Text style={styles.serviceDetail}>⏱️ {service.duration} min</Text>
              {service.location && (
                <Text style={styles.serviceDetail}>📍 {service.location}</Text>
              )}
            </View>
          </View>

          {/* Date Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Selecciona Fecha</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datesScroll}
                >
                  {availableDates.map((dateData) => (
                    <TouchableOpacity
                      key={dateData.date}
                      style={[
                        styles.dateCard,
                        selectedDate === dateData.date && styles.dateCardSelected
                      ]}
                      onPress={() => {
                        console.log('📅 Date selected:', dateData.date);
                        setSelectedDate(dateData.date);
                        setSelectedSlot(null); // Reset slot when changing date
                      }}
                    >
                      <Text style={[
                        styles.dateDayName,
                        selectedDate === dateData.date && styles.dateDayNameSelected
                      ]}>
                        {dateData.dayName}
                      </Text>
                      <Text style={[
                        styles.dateNumber,
                        selectedDate === dateData.date && styles.dateNumberSelected
                      ]}>
                        {formatDate(dateData.date)}
                      </Text>
                      <Text style={[
                        styles.dateSlotsCount,
                        selectedDate === dateData.date && styles.dateSlotsCountSelected
                      ]}>
                        {dateData.slots.length} horario{dateData.slots.length !== 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Time Slots */}
              {selectedDateData && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🕒 Horarios Disponibles</Text>
                  <View style={styles.slotsContainer}>
                    {selectedDateData.slots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.slotCard,
                          !slot.available && styles.slotCardDisabled,
                          selectedSlot?.startTime === slot.startTime && 
                          selectedSlot?.endTime === slot.endTime && styles.slotCardSelected
                        ]}
                        disabled={!slot.available}
                        onPress={() => {
                          console.log('🕒 Slot selected:', slot);
                          slot.available && setSelectedSlot({
                            startTime: slot.startTime,
                            endTime: slot.endTime
                          })
                        }}
                      >
                        <View style={styles.slotTime}>
                          <Clock size={16} color={
                            selectedSlot?.startTime === slot.startTime && 
                            selectedSlot?.endTime === slot.endTime 
                              ? Colors.white 
                              : Colors.primary
                          } />
                          <Text style={[
                            styles.slotTimeText,
                            selectedSlot?.startTime === slot.startTime && 
                            selectedSlot?.endTime === slot.endTime && styles.slotTimeTextSelected
                          ]}>
                            {slot.startTime} - {slot.endTime}
                          </Text>
                        </View>
                        <View style={styles.slotCapacity}>
                          <Users size={14} color={
                            selectedSlot?.startTime === slot.startTime && 
                            selectedSlot?.endTime === slot.endTime 
                              ? Colors.white 
                              : Colors.textLight
                          } />
                          <Text style={[
                            styles.slotCapacityText,
                            selectedSlot?.startTime === slot.startTime && 
                            selectedSlot?.endTime === slot.endTime && styles.slotCapacityTextSelected
                          ]}>
                            {slot.available ? 'Disponible' : 'Ocupado'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Reservation Summary */}
              {selectedDate && selectedSlot && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📋 Resumen de Reserva</Text>
                  <View style={styles.summary}>
                    <Text style={styles.summaryItem}>
                      🎯 Servicio: {service.title}
                    </Text>
                    <Text style={styles.summaryItem}>
                      📅 Fecha: {formatDate(selectedDate)} ({selectedDateData?.dayName})
                    </Text>
                    <Text style={styles.summaryItem}>
                      🕒 Horario: {selectedSlot.startTime} - {selectedSlot.endTime}
                    </Text>
                    <Text style={styles.summaryItem}>
                      💰 Precio: ${service.price}
                    </Text>
                  </View>
                </View>
              )}

              {/* Booking Button */}
              <TouchableOpacity
                style={[
                  styles.bookingButton,
                  (!selectedDate || !selectedSlot || isBooking) && styles.bookingButtonDisabled
                ]}
                onPress={handleReserve}
                disabled={!selectedDate || !selectedSlot || isBooking}
              >
                <Text style={[
                  styles.bookingButtonText,
                  (!selectedDate || !selectedSlot || isBooking) && styles.bookingButtonTextDisabled
                ]}>
                  {isBooking ? '⏳ Agregando al Carrito...' : '🛒 Agregar al Carrito'}
                </Text>
              </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Checkout Confirmation Modal */}
      <Modal
        visible={showCheckoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={styles.checkoutOverlay}>
          <View style={styles.checkoutModal}>
            <View style={styles.checkoutHeader}>
              <ShoppingCart size={32} color={Colors.gold} />
              <Text style={styles.checkoutTitle}>✅ Agregado al Carrito</Text>
            </View>
            
            <View style={styles.checkoutContent}>
              <Text style={styles.checkoutText}>
                El servicio "{service.title}" ha sido agregado a tu carrito.
              </Text>
              <Text style={styles.checkoutSubtext}>
                📅 {formatDate(selectedDate)} a las {selectedSlot?.startTime}
              </Text>
              <Text style={styles.checkoutPrice}>
                💰 ${service.price}
              </Text>
              <Text style={styles.cartInfo}>
                🛒 Tienes {cart.length + 1} {cart.length === 0 ? 'item' : 'items'} en tu carrito
              </Text>
            </View>

            <View style={styles.checkoutActions}>
              <TouchableOpacity
                style={styles.checkoutButtonPrimary}
                onPress={handleCheckoutNow}
              >
                <Text style={styles.checkoutButtonPrimaryText}>
                  💳 Ir a Pagar Ahora
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkoutButtonSecondary}
                onPress={handleContinueShopping}
              >
                <Text style={styles.checkoutButtonSecondaryText}>
                  🔍 Continuar Explorando
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  reserveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reserveButtonDisabled: {
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  serviceInfo: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceDetail: {
    fontSize: 12,
    color: Colors.text,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noScheduleContainer: {
    backgroundColor: Colors.secondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noScheduleText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  noScheduleHint: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  datesScroll: {
    flexGrow: 0,
  },
  dateCard: {
    width: 120,
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  dateCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dateDayName: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  dateDayNameSelected: {
    color: Colors.white,
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  dateNumberSelected: {
    color: Colors.white,
  },
  dateSlotsCount: {
    fontSize: 10,
    color: Colors.textLight,
  },
  dateSlotsCountSelected: {
    color: Colors.white,
  },
  slotsContainer: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  slotCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  slotCardDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.background,
  },
  slotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  slotTimeTextSelected: {
    color: Colors.white,
  },
  slotCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotCapacityText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  slotCapacityTextSelected: {
    color: Colors.white,
  },
  summary: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
  },
  summaryItem: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  bookingButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  bookingButtonDisabled: {
    backgroundColor: Colors.border,
  },
  bookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingButtonTextDisabled: {
    color: Colors.textLight,
  },
  // Checkout Modal Styles
  checkoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  checkoutModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  checkoutHeader: {
    backgroundColor: Colors.gold + '20',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  checkoutContent: {
    padding: 24,
  },
  checkoutText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  checkoutSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  checkoutPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginVertical: 12,
  },
  cartInfo: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  checkoutActions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkoutButtonPrimary: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  checkoutButtonSecondary: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkoutButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});