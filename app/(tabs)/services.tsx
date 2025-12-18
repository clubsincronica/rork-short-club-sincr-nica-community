import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, Calendar, DollarSign, Users, ShoppingCart, Bell, MessageSquare, Clock, CreditCard, ChevronRight, Package, TrendingUp, AlertCircle, CheckCircle, Plus, QrCode } from '@/components/SmartIcons';
import { useUser } from '@/hooks/user-store';
import { useCalendar } from '@/hooks/calendar-store';
import { mockServices } from '@/mocks/data';
import { Colors } from '@/constants/colors';

import { router } from 'expo-router';

type ServiceSection = 'overview' | 'calendar' | 'reservations' | 'cart' | 'followup' | 'notifications';

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const { events, userEvents, upcomingEvents } = useCalendar();
  const [activeSection, setActiveSection] = useState<ServiceSection>('overview');

  // If no user logged in, show login prompt
  if (!currentUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Servicios</Text>
        </View>
        <View style={styles.emptyState}>
          <Package size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Inicia sesión para ver tus servicios</Text>
          <Text style={styles.emptySubtitle}>
            Accede a tu cuenta para gestionar reservas, calendario y más
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mock user's services (in real app, this would come from API)
  const userServices = mockServices.filter(service => service.providerId === currentUser?.id);

  // Calculate real stats from calendar events
  const stats = {
    totalEarnings: userEvents.reduce((sum, event) => sum + (event.price * event.currentParticipants), 0),
    totalBookings: userEvents.reduce((sum, event) => sum + event.currentParticipants, 0),
    averageRating: 4.9, // This would come from reviews in a real app
    activeServices: userEvents.length,
  };
  
  // Debug logging
  console.log('📊 MisServicios Stats for user', currentUser?.name, ':', stats);
  console.log('📊 User events count:', userEvents.length);
  console.log('📊 Upcoming events:', upcomingEvents.length);

  // Convert calendar events to reservation format for display
  const upcomingReservations = upcomingEvents.slice(0, 3).map(event => {
    const eventDate = new Date(event.date + ' ' + event.startTime);
    const now = new Date();
    const isToday = eventDate.toDateString() === now.toDateString();
    const isTomorrow = eventDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let dateDisplay = '';
    if (isToday) {
      dateDisplay = `Hoy, ${event.startTime}`;
    } else if (isTomorrow) {
      dateDisplay = `Mañana, ${event.startTime}`;
    } else {
      const month = eventDate.toLocaleDateString('es-ES', { month: 'short' });
      const day = eventDate.getDate();
      dateDisplay = `${month} ${day}, ${event.startTime}`;
    }
    
    return {
      id: event.id,
      service: event.title,
      client: event.currentParticipants > 0 ? `${event.currentParticipants} participante(s)` : 'Sin reservas',
      date: dateDisplay,
      status: event.currentParticipants > 0 ? 'confirmed' : 'pending',
      price: event.price
    };
  });

  const cartItems: any[] = [];

  const notifications: any[] = [];

  const followUpClients: any[] = [];

  const renderSectionButton = (section: ServiceSection, icon: React.ReactNode, title: string, subtitle: string, highlight?: boolean) => {
    if (!section.trim()) return null;
    
    return (
      <TouchableOpacity 
        style={[styles.sectionButton, highlight && styles.sectionButtonHighlight]}
        onPress={() => setActiveSection(section)}
        testID={`section-${section}`}
      >
        <View style={[styles.sectionIcon, highlight && styles.sectionIconHighlight]}>
          {icon}
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionButtonTitle}>{title}</Text>
          <Text style={styles.sectionButtonSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={Colors.textLight} />
      </TouchableOpacity>
    );
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.quickActions}>
        {renderSectionButton('calendar', <Calendar size={24} color={Colors.primary} />, 'Mi Calendario', 'Ver disponibilidad y eventos', false)}
        {renderSectionButton('reservations', <Clock size={24} color={Colors.secondary} />, 'Administrar Reservas', `${upcomingReservations.length} reservas`, upcomingReservations.length > 0)}
        {renderSectionButton('cart', <ShoppingCart size={24} color={Colors.accent} />, 'Carrito y Pagos', `${cartItems.length} items`, false)}
        {renderSectionButton('followup', <MessageSquare size={24} color={Colors.accentLight} />, 'Seguimiento', `${followUpClients.length} clientes`, false)}
        {renderSectionButton('notifications', <Bell size={24} color={Colors.warning} />, 'Notificaciones', `${notifications.filter((n: any) => n.unread).length} nuevas`, notifications.some((n: any) => n.unread))}
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        {upcomingReservations.slice(0, 2).map(reservation => (
          <View key={reservation.id} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Clock size={20} color={Colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{reservation.service}</Text>
              <Text style={styles.activitySubtitle}>{reservation.client} • {reservation.date}</Text>
            </View>
            <View style={[styles.statusBadge, reservation.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
              <Text style={styles.statusBadgeText}>
                {reservation.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.sectionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('overview')}>
          <ChevronRight size={20} color={Colors.primary} style={styles.rotatedIcon} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        
        <View style={styles.sectionHeaderWithAction}>
          <Text style={styles.sectionTitle}>Mi Calendario</Text>
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={() => router.push('/add-event')}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addEventButtonText}>Agregar Evento</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/calendar')}
        >
          <Calendar size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Abrir Calendario Completo</Text>
        </TouchableOpacity>

        <View style={styles.calendarStats}>
          <View style={styles.calendarStatCard}>
            <Text style={styles.calendarStatValue}>{userEvents.length}</Text>
            <Text style={styles.calendarStatLabel}>Eventos creados</Text>
          </View>
          <View style={styles.calendarStatCard}>
            <Text style={styles.calendarStatValue}>{upcomingEvents.length}</Text>
            <Text style={styles.calendarStatLabel}>Próximos eventos</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Próximos Eventos</Text>
        {upcomingReservations.length > 0 ? (
          upcomingReservations.map(reservation => (
            <View key={reservation.id} style={styles.eventCard}>
              <View style={styles.eventTime}>
                <Text style={styles.eventTimeText}>{reservation.date.split(',')[1]?.trim() || ''}</Text>
                <Text style={styles.eventDateText}>{reservation.date.split(',')[0]}</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{reservation.service}</Text>
                <Text style={styles.eventClient}>{reservation.client}</Text>
                <Text style={styles.eventPrice}>€{reservation.price}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyEventsContainer}>
            <Calendar size={48} color={Colors.border} />
            <Text style={styles.emptyEventsText}>No tienes eventos próximos</Text>
            <Text style={styles.emptyEventsSubtext}>Crea tu primer evento para comenzar</Text>
          </View>
        )}
      </View>
  );

  const renderReservations = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('overview')}>
        <ChevronRight size={20} color={Colors.primary} style={styles.rotatedIcon} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Administrar Reservas</Text>
      
      {upcomingReservations.length > 0 ? (
        <>
          {upcomingReservations.map(reservation => (
            <View key={reservation.id} style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <View>
                  <Text style={styles.reservationService}>{reservation.service}</Text>
                  <Text style={styles.reservationClient}>{reservation.client}</Text>
                </View>
                <Text style={styles.reservationPrice}>${reservation.price}</Text>
              </View>
              <View style={styles.reservationDetails}>
                <View style={styles.reservationDate}>
                  <Clock size={16} color={Colors.textLight} />
                  <Text style={styles.reservationDateText}>{reservation.date}</Text>
                </View>
                <View style={[
                  styles.reservationStatus,
                  reservation.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending
                ]}>
                  <Text style={styles.reservationStatusText}>
                    {reservation.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </Text>
                </View>
              </View>
              
              {/* Action buttons for pending reservations */}
              {reservation.status === 'pending' && (
                <View style={styles.reservationActions}>
                  <TouchableOpacity 
                    style={styles.declineButton}
                    onPress={() => {
                      Alert.alert(
                        'Cancelar Reserva',
                        '¿Estás seguro que deseas cancelar esta reserva?',
                        [
                          { text: 'No', style: 'cancel' },
                          { 
                            text: 'Sí, Cancelar',
                            style: 'destructive',
                            onPress: () => {
                              // TODO: Implement cancel reservation logic
                              Alert.alert('Reserva cancelada');
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.declineButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => {
                      // TODO: Implement accept reservation logic
                      Alert.alert('Reserva confirmada', 'La reserva ha sido confirmada exitosamente.');
                    }}
                  >
                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Clock size={64} color={Colors.border} />
          <Text style={styles.emptyStateTitle}>No hay reservas</Text>
          <Text style={styles.emptyStateText}>
            Las reservas de tus eventos aparecerán aquí cuando los usuarios se registren.
          </Text>
        </View>
      )}
    </View>
  );

  const renderCart = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('overview')}>
        <ChevronRight size={20} color={Colors.primary} style={styles.rotatedIcon} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Carrito y Pagos</Text>
      
      {cartItems.length > 0 ? (
        <>
          <View style={styles.cartSummary}>
            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>Subtotal</Text>
              <Text style={styles.cartSummaryValue}>
                ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
              </Text>
            </View>
            <View style={styles.cartSummaryRow}>
              <Text style={styles.cartSummaryLabel}>Comisión plataforma</Text>
              <Text style={styles.cartSummaryValue}>
                -${(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1).toFixed(0)}
              </Text>
            </View>
            <View style={[styles.cartSummaryRow, styles.cartSummaryTotal]}>
              <Text style={styles.cartTotalLabel}>Total a recibir</Text>
              <Text style={styles.cartTotalValue}>
                ${(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.9).toFixed(0)}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/payment')}
          >
            <CreditCard size={20} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Procesar Pago</Text>
          </TouchableOpacity>

          <Text style={styles.subsectionTitle}>Items en Carrito</Text>
          {cartItems.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.cartItemIcon}>
                <Package size={20} color={Colors.primary} />
              </View>
              <View style={styles.cartItemContent}>
                <Text style={styles.cartItemTitle}>{item.service}</Text>
                <Text style={styles.cartItemProvider}>{item.provider}</Text>
                <View style={styles.cartItemFooter}>
                  <Text style={styles.cartItemQuantity}>Cantidad: {item.quantity}</Text>
                  <Text style={styles.cartItemPrice}>${item.price * item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyStateContainer}>
          <ShoppingCart size={64} color={Colors.border} />
          <Text style={styles.emptyStateTitle}>Carrito vacío</Text>
          <Text style={styles.emptyStateText}>
            Los pagos de tus eventos aparecerán aquí cuando los participantes se registren.
          </Text>
        </View>
      )}
    </View>
  );

  const renderFollowUp = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('overview')}>
        <ChevronRight size={20} color={Colors.primary} style={styles.rotatedIcon} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Seguimiento de Clientes</Text>
      
      {followUpClients.length > 0 ? (
        <>
          <View style={styles.followUpStats}>
            <View style={styles.followUpStatCard}>
              <TrendingUp size={20} color={Colors.success} />
              <Text style={styles.followUpStatValue}>--</Text>
              <Text style={styles.followUpStatLabel}>Tasa de retención</Text>
            </View>
            <View style={styles.followUpStatCard}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.followUpStatValue}>{followUpClients.length}</Text>
              <Text style={styles.followUpStatLabel}>Clientes activos</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>Clientes para Contactar</Text>
          {followUpClients.map(client => (
            <View key={client.id} style={styles.followUpCard}>
              <View style={styles.followUpAvatar}>
                <Text style={styles.followUpAvatarText}>{client.name.split(' ').map((n: string) => n[0]).join('')}</Text>
              </View>
              <View style={styles.followUpContent}>
                <Text style={styles.followUpName}>{client.name}</Text>
                <Text style={styles.followUpService}>{client.service}</Text>
                <Text style={styles.followUpTime}>Última sesión: {client.lastSession}</Text>
                <Text style={styles.followUpNotes}>{client.notes}</Text>
              </View>
              <TouchableOpacity style={styles.followUpAction}>
                <MessageSquare size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Users size={64} color={Colors.border} />
          <Text style={styles.emptyStateTitle}>Sin clientes activos</Text>
          <Text style={styles.emptyStateText}>
            Cuando los participantes asistan a tus eventos, podrás hacer seguimiento y mantener contacto con ellos aquí.
          </Text>
        </View>
      )}
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('overview')}>
        <ChevronRight size={20} color={Colors.primary} style={styles.rotatedIcon} />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Notificaciones y Mensajes</Text>
      
      <View style={styles.notificationSettings}>
        <Text style={styles.subsectionTitle}>Configuración Rápida</Text>
        <View style={styles.notificationToggle}>
          <Text style={styles.notificationToggleText}>Push Notifications</Text>
          <View style={styles.toggleSwitch}>
            <View style={styles.toggleSwitchActive} />
          </View>
        </View>
        <View style={styles.notificationToggle}>
          <Text style={styles.notificationToggleText}>Email Notifications</Text>
          <View style={styles.toggleSwitch}>
            <View style={styles.toggleSwitchActive} />
          </View>
        </View>
      </View>

      {notifications.length > 0 ? (
        <>
          <Text style={styles.subsectionTitle}>Notificaciones Recientes</Text>
          {notifications.map(notification => (
            <TouchableOpacity key={notification.id} style={[styles.notificationCard, notification.unread && styles.notificationUnread]}>
              <View style={[
                styles.notificationIcon,
                notification.type === 'booking' && styles.notificationIconBooking,
                notification.type === 'payment' && styles.notificationIconPayment,
                notification.type === 'reminder' && styles.notificationIconReminder,
                notification.type === 'review' && styles.notificationIconReview,
              ]}>
                {notification.type === 'booking' && <Calendar size={20} color={Colors.white} />}
                {notification.type === 'payment' && <DollarSign size={20} color={Colors.white} />}
                {notification.type === 'reminder' && <Clock size={20} color={Colors.white} />}
                {notification.type === 'review' && <Star size={20} color={Colors.white} />}
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {notification.unread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Bell size={64} color={Colors.border} />
          <Text style={styles.emptyStateTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyStateText}>
            Las notificaciones sobre reservas, pagos y mensajes aparecerán aquí.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {activeSection === 'overview' ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.greeting}>
                <Text style={styles.headerTitle}>Mis Servicios</Text>
                <Text style={styles.headerSubtitle}>Centro de gestión integral</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => router.push('/qr-scanner')}
                testID="qr-scanner-button"
              >
                <QrCode size={24} color={Colors.white} />
              </TouchableOpacity>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <DollarSign size={20} color={Colors.textOnGold} />
                  <Text style={styles.statValue}>${stats.totalEarnings}</Text>
                  <Text style={styles.statLabel}>Ganancias</Text>
                </View>
                <View style={styles.statItem}>
                  <Users size={20} color={Colors.textOnGold} />
                  <Text style={styles.statValue}>{stats.totalBookings}</Text>
                  <Text style={styles.statLabel}>Reservas</Text>
                </View>
                <View style={styles.statItem}>
                  <Star size={20} color={Colors.textOnGold} />
                  <Text style={styles.statValue}>{stats.averageRating}</Text>
                  <Text style={styles.statLabel}>Calificación</Text>
                </View>
                <View style={styles.statItem}>
                  <Calendar size={20} color={Colors.textOnGold} />
                  <Text style={styles.statValue}>{stats.activeServices}</Text>
                  <Text style={styles.statLabel}>Activos</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.content}>
            {renderOverview()}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.fullContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.greeting}>
                <Text style={styles.headerTitle}>Mis Servicios</Text>
                <Text style={styles.headerSubtitle}>Centro de gestión integral</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => router.push('/qr-scanner')}
                testID="qr-scanner-button"
              >
                <QrCode size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
          
          {activeSection === 'calendar' && (
            <ScrollView style={styles.sectionScrollContainer} showsVerticalScrollIndicator={false}>
              {renderCalendar()}
            </ScrollView>
          )}
          {activeSection === 'reservations' && (
            <ScrollView style={styles.sectionScrollContainer} showsVerticalScrollIndicator={false}>
              {renderReservations()}
            </ScrollView>
          )}
          {activeSection === 'cart' && (
            <ScrollView style={styles.sectionScrollContainer} showsVerticalScrollIndicator={false}>
              {renderCart()}
            </ScrollView>
          )}
          {activeSection === 'followup' && (
            <ScrollView style={styles.sectionScrollContainer} showsVerticalScrollIndicator={false}>
              {renderFollowUp()}
            </ScrollView>
          )}
          {activeSection === 'notifications' && (
            <ScrollView style={styles.sectionScrollContainer} showsVerticalScrollIndicator={false}>
              {renderNotifications()}
            </ScrollView>
          )}
        </View>
      )}
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
  header: {
    backgroundColor: Colors.white,
    paddingBottom: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 1,
    position: 'relative',
  },
  greeting: {
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.gold,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textOnGold,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textOnGold,
    opacity: 0.9,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 25,
    padding: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    minHeight: '100%',
    backgroundColor: Colors.background,
  },
  servicesSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 120,
  },
  serviceContent: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingsSection: {
    paddingHorizontal: 16,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bookingImage: {
    width: 80,
    height: 80,
  },
  bookingContent: {
    flex: 1,
    padding: 16,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bookingProvider: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overviewContainer: {
    paddingHorizontal: 16,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionButtonHighlight: {
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: '#FFF8E1',
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionIconHighlight: {
    backgroundColor: Colors.gold + '20',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionButtonSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: Colors.success + '20',
  },
  statusPending: {
    backgroundColor: Colors.warning + '20',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  calendarStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  calendarStatCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  calendarStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  calendarStatLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTime: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  eventTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventDateText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  eventClient: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 4,
  },
  reservationTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  reservationTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeReservationTab: {
    backgroundColor: Colors.white,
  },
  reservationTabText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  activeReservationTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  reservationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reservationService: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  reservationClient: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 2,
  },
  reservationPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  reservationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reservationDateText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  reservationStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reservationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  cartSummary: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cartSummaryLabel: {
    fontSize: 14,
    color: Colors.textOnGold,
  },
  cartSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textOnGold,
  },
  cartSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.text + '20',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textOnGold,
  },
  cartTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cartItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartItemContent: {
    flex: 1,
  },
  cartItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cartItemProvider: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  cartItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cartItemQuantity: {
    fontSize: 14,
    color: Colors.textLight,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  paymentMethods: {
    marginTop: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  followUpStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  followUpStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  followUpStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  followUpStatLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  followUpCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  followUpAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  followUpAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  followUpContent: {
    flex: 1,
  },
  followUpName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  followUpService: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 2,
  },
  followUpTime: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  followUpNotes: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
    fontStyle: 'italic',
  },
  followUpAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationSettings: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationToggleText: {
    fontSize: 16,
    color: Colors.text,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    padding: 2,
  },
  toggleSwitchActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    marginLeft: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationUnread: {
    backgroundColor: Colors.gold + '20',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIconBooking: {
    backgroundColor: Colors.primary,
  },
  notificationIconPayment: {
    backgroundColor: Colors.success,
  },
  notificationIconReminder: {
    backgroundColor: Colors.warning,
  },
  notificationIconReview: {
    backgroundColor: Colors.gold,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
  fullContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionScrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D8B8B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#2D8B8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  qrButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
