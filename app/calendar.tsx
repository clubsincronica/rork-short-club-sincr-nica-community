import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  ShoppingCart,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Globe,
  Lock,
  CreditCard,
  Tag,
} from 'lucide-react-native';
import { useCalendar, useEventsForDate } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';
import { Colors, Gradients } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarEvent, ServiceCategory } from '@/types/user';
import { router } from 'expo-router';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'yoga', label: 'Yoga' },
  { value: 'meditation', label: 'Meditación' },
  { value: 'healing', label: 'Sanación' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'therapy', label: 'Terapia' },
  { value: 'nutrition', label: 'Nutrición' },
  { value: 'energy-work', label: 'Trabajo Energético' },
  { value: 'spiritual-guidance', label: 'Guía Espiritual' },
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const {
    events,
    userEvents,
    userReservations,
    cart,
    cartTotal,
    settings,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    addToCart,
    removeFromCart,
    clearCart,
    createReservation,
    cancelReservation,
    updateSettings,
    checkoutCart,
  } = useCalendar();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'myEvents' | 'reservations' | 'settings'>('calendar');
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'yoga' as ServiceCategory,
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    isOnline: false,
    maxParticipants: 10,
    price: 0,
    tags: '',
  });

  const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const eventsForSelectedDate = useEventsForDate(selectedDateString);

  // Generate calendar days
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

  const handleCreateEvent = async () => {
    if (!currentUser?.isServiceProvider) {
      Alert.alert('Permiso Requerido', 'Solo los proveedores de servicios pueden crear eventos.');
      return;
    }

    if (!eventForm.title || !eventForm.date || !eventForm.startTime || !eventForm.endTime) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    const newEvent = await addEvent({
      providerId: currentUser.id,
      title: eventForm.title,
      description: eventForm.description,
      category: eventForm.category,
      date: eventForm.date,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      location: eventForm.location,
      isOnline: eventForm.isOnline,
      maxParticipants: eventForm.maxParticipants,
      price: eventForm.price,
      tags: eventForm.tags.split(',').map(t => t.trim()).filter(t => t),
    });

    if (newEvent) {
      setIsEventModalVisible(false);
      resetEventForm();
      Alert.alert('Éxito', 'Evento creado exitosamente.');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    await updateEvent(editingEvent.id, {
      title: eventForm.title,
      description: eventForm.description,
      category: eventForm.category,
      date: eventForm.date,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      location: eventForm.location,
      isOnline: eventForm.isOnline,
      maxParticipants: eventForm.maxParticipants,
      price: eventForm.price,
      tags: eventForm.tags.split(',').map(t => t.trim()).filter(t => t),
    });

    setIsEventModalVisible(false);
    setEditingEvent(null);
    resetEventForm();
    Alert.alert('Éxito', 'Evento actualizado exitosamente.');
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(eventId);
            Alert.alert('Éxito', 'Evento eliminado.');
          },
        },
      ]
    );
  };

  const handleReserveEvent = async (event: CalendarEvent) => {
    if (!currentUser) {
      Alert.alert('Iniciar Sesión', 'Por favor inicia sesión para hacer una reserva.');
      return;
    }

    await addToCart(event.id);
    Alert.alert('Añadido al Carrito', `${event.title} ha sido añadido a tu carrito.`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    Alert.alert(
      'Confirmar Pago',
      `Total: €${cartTotal.toFixed(2)}\n¿Proceder con el pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: async () => {
            const reservations = await checkoutCart('credit-card');
            if (reservations) {
              setIsCartModalVisible(false);
              Alert.alert('Éxito', 'Reservas confirmadas. Te enviaremos los detalles por email.');
            }
          },
        },
      ]
    );
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      category: 'yoga',
      date: selectedDateString,
      startTime: '',
      endTime: '',
      location: '',
      isOnline: false,
      maxParticipants: 10,
      price: 0,
      tags: '',
    });
  };

  const openEventModal = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description,
        category: event.category,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location || '',
        isOnline: event.isOnline,
        maxParticipants: event.maxParticipants,
        price: event.price,
        tags: event.tags.join(', '),
      });
    } else {
      setEditingEvent(null);
      resetEventForm();
    }
    setIsEventModalVisible(true);
  };

  const renderCalendarDay = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateString);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

    return (
      <TouchableOpacity
        key={dateString}
        style={[
          styles.calendarDay,
          isToday && styles.calendarDayToday,
          isSelected && styles.calendarDaySelected,
          !isCurrentMonth && styles.calendarDayOtherMonth,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text
          style={[
            styles.calendarDayText,
            isToday && styles.calendarDayTextToday,
            isSelected && styles.calendarDayTextSelected,
            !isCurrentMonth && styles.calendarDayTextOtherMonth,
          ]}
        >
          {date.getDate()}
        </Text>
        {dayEvents.length > 0 && (
          <View style={styles.calendarDayDot} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }: { item: CalendarEvent }) => {
    const isMyEvent = currentUser?.id === item.providerId;
    const hasReservation = userReservations.some(r => r.eventId === item.id && r.status !== 'cancelled');
    const availableSpots = item.maxParticipants - item.currentParticipants;

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTime}>
            <Clock size={14} color={Colors.primary} />
            <Text style={styles.eventTimeText}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          {isMyEvent && (
            <View style={styles.eventActions}>
              <TouchableOpacity onPress={() => openEventModal(item)}>
                <Edit2 size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteEvent(item.id)}>
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.eventTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.eventDetails}>
          {item.location && (
            <View style={styles.eventDetail}>
              <MapPin size={12} color={Colors.textLight} />
              <Text style={styles.eventDetailText}>{item.location}</Text>
            </View>
          )}
          <View style={styles.eventDetail}>
            <Users size={12} color={Colors.textLight} />
            <Text style={styles.eventDetailText}>
              {item.currentParticipants}/{item.maxParticipants} participantes
            </Text>
          </View>
          {item.price > 0 && (
            <View style={styles.eventDetail}>
              <DollarSign size={12} color={Colors.textLight} />
              <Text style={styles.eventDetailText}>€{item.price}</Text>
            </View>
          )}
        </View>

        {item.tags.length > 0 && (
          <View style={styles.eventTags}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.eventTag}>
                <Text style={styles.eventTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {!isMyEvent && (
          <View style={styles.eventFooter}>
            {hasReservation ? (
              <View style={styles.reservedBadge}>
                <Check size={14} color={Colors.success} />
                <Text style={styles.reservedText}>Reservado</Text>
              </View>
            ) : availableSpots > 0 ? (
              <TouchableOpacity
                style={styles.reserveButton}
                onPress={() => handleReserveEvent(item)}
              >
                <ShoppingCart size={16} color={Colors.white} />
                <Text style={styles.reserveButtonText}>Reservar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.fullBadge}>
                <Text style={styles.fullText}>Completo</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Mi Calendario</Text>
        <View style={styles.headerTabs}>
          <TouchableOpacity
            style={[styles.headerTab, viewMode === 'calendar' && styles.headerTabActive]}
            onPress={() => setViewMode('calendar')}
          >
            <CalendarIcon size={18} color={viewMode === 'calendar' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.headerTabText, viewMode === 'calendar' && styles.headerTabTextActive]}>
              Calendario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, viewMode === 'myEvents' && styles.headerTabActive]}
            onPress={() => setViewMode('myEvents')}
          >
            <Clock size={18} color={viewMode === 'myEvents' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.headerTabText, viewMode === 'myEvents' && styles.headerTabTextActive]}>
              Mis Eventos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, viewMode === 'reservations' && styles.headerTabActive]}
            onPress={() => setViewMode('reservations')}
          >
            <Check size={18} color={viewMode === 'reservations' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.headerTabText, viewMode === 'reservations' && styles.headerTabTextActive]}>
              Reservas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, viewMode === 'settings' && styles.headerTabActive]}
            onPress={() => setViewMode('settings')}
          >
            <Settings size={18} color={viewMode === 'settings' ? Colors.white : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.headerTabText, viewMode === 'settings' && styles.headerTabTextActive]}>
              Ajustes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'calendar' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarContainer}>
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

            <View style={styles.calendarWeekdays}>
              {WEEKDAYS.map(day => (
                <Text key={day} style={styles.calendarWeekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map(day => renderCalendarDay(day))}
            </View>
          </View>

          <View style={styles.selectedDateSection}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>
                {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
              </Text>
              {currentUser?.isServiceProvider && (
                <TouchableOpacity
                  style={styles.addEventButton}
                  onPress={() => router.push('/add-event')}
                >
                  <Plus size={20} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {eventsForSelectedDate.length > 0 ? (
              <View>
                {eventsForSelectedDate.map(event => (
                  <View key={event.id}>
                    {renderEvent({ item: event })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noEventsContainer}>
                <CalendarIcon size={48} color={Colors.border} />
                <Text style={styles.noEventsText}>No hay eventos para este día</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {viewMode === 'myEvents' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Mis Eventos Creados</Text>
            {userEvents.length > 0 ? (
              <View>
                {userEvents.map(event => (
                  <View key={event.id}>
                    {renderEvent({ item: event })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <CalendarIcon size={48} color={Colors.border} />
                <Text style={styles.emptyStateText}>No has creado ningún evento</Text>
                {currentUser?.isServiceProvider && (
                  <TouchableOpacity
                    style={styles.createFirstEventButton}
                    onPress={() => openEventModal()}
                  >
                    <Text style={styles.createFirstEventText}>Crear mi primer evento</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {viewMode === 'reservations' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Mis Reservas</Text>
            {userReservations.filter(r => r.status !== 'cancelled').length > 0 ? (
              userReservations
                .filter(r => r.status !== 'cancelled')
                .map(reservation => (
                  <View key={reservation.id} style={styles.reservationCard}>
                    <View style={styles.reservationHeader}>
                      <Text style={styles.reservationTitle}>{reservation.event.title}</Text>
                      <View style={[
                        styles.reservationStatus,
                        reservation.status === 'confirmed' && styles.reservationStatusConfirmed,
                        reservation.status === 'pending' && styles.reservationStatusPending,
                      ]}>
                        <Text style={styles.reservationStatusText}>
                          {reservation.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reservationDetails}>
                      <Text style={styles.reservationDetail}>
                        <CalendarIcon size={12} color={Colors.textLight} /> {reservation.event.date}
                      </Text>
                      <Text style={styles.reservationDetail}>
                        <Clock size={12} color={Colors.textLight} /> {reservation.event.startTime}
                      </Text>
                      <Text style={styles.reservationDetail}>
                        <Users size={12} color={Colors.textLight} /> {reservation.numberOfSpots} plaza(s)
                      </Text>
                      <Text style={styles.reservationDetail}>
                        <DollarSign size={12} color={Colors.textLight} /> €{reservation.totalPrice}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelReservationButton}
                      onPress={() => {
                        Alert.alert(
                          'Cancelar Reserva',
                          '¿Estás seguro de que quieres cancelar esta reserva?',
                          [
                            { text: 'No', style: 'cancel' },
                            {
                              text: 'Sí, cancelar',
                              style: 'destructive',
                              onPress: () => cancelReservation(reservation.id),
                            },
                          ]
                        );
                      }}
                    >
                      <X size={16} color={Colors.error} />
                      <Text style={styles.cancelReservationText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Check size={48} color={Colors.border} />
                <Text style={styles.emptyStateText}>No tienes reservas activas</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {viewMode === 'settings' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Configuración del Calendario</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Globe size={20} color={Colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Calendario Público</Text>
                  <Text style={styles.settingDescription}>
                    Permite que otros usuarios vean tu calendario
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.isPublic}
                onValueChange={(value) => updateSettings({ isPublic: value })}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Users size={20} color={Colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Permitir Reservas</Text>
                  <Text style={styles.settingDescription}>
                    Los usuarios pueden reservar tus eventos
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.allowReservations}
                onValueChange={(value) => updateSettings({ allowReservations: value })}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Check size={20} color={Colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Auto-confirmar Reservas</Text>
                  <Text style={styles.settingDescription}>
                    Las reservas se confirman automáticamente
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.autoConfirmReservations}
                onValueChange={(value) => updateSettings({ autoConfirmReservations: value })}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setIsCartModalVisible(true)}
        >
          <ShoppingCart size={24} color={Colors.white} />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Event Creation/Edit Modal */}
      <Modal
        visible={isEventModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Editar Evento' : 'Crear Evento'}
              </Text>
              <TouchableOpacity onPress={() => setIsEventModalVisible(false)}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título *</Text>
                <TextInput
                  style={styles.input}
                  value={eventForm.title}
                  onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
                  placeholder="Nombre del evento"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={eventForm.description}
                  onChangeText={(text) => setEventForm({ ...eventForm, description: text })}
                  placeholder="Describe tu evento..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SERVICE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        eventForm.category === cat.value && styles.categoryChipActive,
                      ]}
                      onPress={() => setEventForm({ ...eventForm, category: cat.value })}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          eventForm.category === cat.value && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                  <Text style={styles.inputLabel}>Fecha *</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.date}
                    onChangeText={(text) => setEventForm({ ...eventForm, date: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                  <Text style={styles.inputLabel}>Precio (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.price.toString()}
                    onChangeText={(text) => setEventForm({ ...eventForm, price: parseFloat(text) || 0 })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                  <Text style={styles.inputLabel}>Hora Inicio *</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.startTime}
                    onChangeText={(text) => setEventForm({ ...eventForm, startTime: text })}
                    placeholder="HH:MM"
                  />
                </View>
                <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                  <Text style={styles.inputLabel}>Hora Fin *</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.endTime}
                    onChangeText={(text) => setEventForm({ ...eventForm, endTime: text })}
                    placeholder="HH:MM"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación</Text>
                <TextInput
                  style={styles.input}
                  value={eventForm.location}
                  onChangeText={(text) => setEventForm({ ...eventForm, location: text })}
                  placeholder="Dirección o enlace online"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Máx. Participantes</Text>
                <TextInput
                  style={styles.input}
                  value={eventForm.maxParticipants.toString()}
                  onChangeText={(text) => setEventForm({ ...eventForm, maxParticipants: parseInt(text) || 1 })}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Etiquetas (separadas por comas)</Text>
                <TextInput
                  style={styles.input}
                  value={eventForm.tags}
                  onChangeText={(text) => setEventForm({ ...eventForm, tags: text })}
                  placeholder="relajación, principiantes, etc."
                />
              </View>

              <View style={styles.switchGroup}>
                <View style={styles.switchLeft}>
                  <Globe size={20} color={Colors.primary} />
                  <Text style={styles.switchLabel}>Evento Online</Text>
                </View>
                <Switch
                  value={eventForm.isOnline}
                  onValueChange={(value) => setEventForm({ ...eventForm, isOnline: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={editingEvent ? handleUpdateEvent : handleCreateEvent}
            >
              <Text style={styles.saveButtonText}>
                {editingEvent ? 'Actualizar Evento' : 'Crear Evento'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal
        visible={isCartModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Carrito de Reservas</Text>
              <TouchableOpacity onPress={() => setIsCartModalVisible(false)}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {cart.map(item => (
                <View key={item.eventId} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemTitle}>{item.event.title}</Text>
                    <Text style={styles.cartItemDetails}>
                      {item.event.date} • {item.event.startTime}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      {item.numberOfSpots} plaza(s) × €{item.event.price} = €{item.price}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.eventId)}
                    style={styles.cartItemRemove}
                  >
                    <Trash2 size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.cartTotal}>
                <Text style={styles.cartTotalLabel}>Total:</Text>
                <Text style={styles.cartTotalAmount}>€{cartTotal.toFixed(2)}</Text>
              </View>
            </ScrollView>

            <View style={styles.cartActions}>
              <TouchableOpacity
                style={styles.clearCartButton}
                onPress={() => {
                  clearCart();
                  setIsCartModalVisible(false);
                }}
              >
                <Text style={styles.clearCartText}>Vaciar Carrito</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                <CreditCard size={20} color={Colors.white} />
                <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  headerTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  headerTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  headerTabActive: {
    backgroundColor: Colors.cream,
  },
  headerTabText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  headerTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
  },
  calendarDayTextToday: {
    color: Colors.primary,
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  calendarDayTextOtherMonth: {
    color: Colors.textLight,
  },
  calendarDayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  selectedDateSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  addEventButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTimeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  eventTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  eventTag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reserveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  reserveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  reservedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reservedText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  fullBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fullText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  sectionContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 12,
    marginBottom: 24,
  },
  createFirstEventButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstEventText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  reservationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  reservationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reservationStatusConfirmed: {
    backgroundColor: Colors.success + '20',
  },
  reservationStatusPending: {
    backgroundColor: Colors.warning + '20',
  },
  reservationStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  reservationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  reservationDetail: {
    fontSize: 12,
    color: Colors.textLight,
  },
  cancelReservationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelReservationText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
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
  cartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
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
  inputGroupHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
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
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '500',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  cartItemDetails: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  cartItemRemove: {
    padding: 8,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  cartTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  cartTotalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  cartActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  clearCartButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  clearCartText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
