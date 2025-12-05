import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode,
  CheckCircle,
  X,
  Eye,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  Download,
  Share as ShareIcon,
  ChevronRight,
  User
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { useCalendar } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';
import { AttendanceManager } from '@/utils/ticketGenerator';
import { Reservation } from '@/types/user';
import { TouchableScale } from '@/components/TouchableScale';

const { width: screenWidth } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  providerId: string;
  location?: string;
  price?: number;
  maxParticipants?: number;
  currentParticipants?: number;
}

interface HostAttendanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

interface EventAttendanceData {
  event: Event;
  reservations: Reservation[];
  checkedIn: number;
  totalReserved: number;
  attendanceRate: number;
  revenue: number;
}

export function HostAttendanceDashboard({ visible, onClose }: HostAttendanceDashboardProps) {
  const { events, userReservations } = useCalendar();
  const { currentUser } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventAttendanceData | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Get events hosted by current user with attendance data
  const hostedEventsData = useMemo(() => {
    if (!currentUser) return [];
    
    const myEvents = events.filter((event: any) => event.providerId === currentUser.id);
    
    return myEvents.map((event: any) => {
      const eventReservations = userReservations.filter((res: any) => res.eventId === event.id);
      const checkedIn = eventReservations.filter((res: any) => res.isCheckedIn).length;
      const totalReserved = eventReservations.reduce((sum: number, res: any) => sum + res.numberOfSpots, 0);
      const attendanceRate = totalReserved > 0 ? (checkedIn / totalReserved) * 100 : 0;
      const revenue = eventReservations
        .filter((res: any) => res.status === 'confirmed')
        .reduce((sum: number, res: any) => sum + (res.totalPrice || 0), 0);
      
      return {
        event,
        reservations: eventReservations,
        checkedIn,
        totalReserved,
        attendanceRate,
        revenue,
      };
    }).sort((a: EventAttendanceData, b: EventAttendanceData) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());
  }, [events, userReservations, currentUser]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleViewEventDetails = (eventData: EventAttendanceData) => {
    setSelectedEvent(eventData);
    setShowEventDetails(true);
  };

  const handleManualCheckIn = (reservation: Reservation) => {
    Alert.alert(
      'Check-in Manual',
      `¿Confirmar check-in para reserva ${reservation.id.substring(0, 8)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            // For manual check-in, we'll simulate the attendance update
            // In a real app, this would update the reservation status
            Alert.alert('Éxito', 'Check-in manual registrado');
          }
        }
      ]
    );
  };

  const handleExportAttendance = (eventData: EventAttendanceData) => {
    // In a real app, this would generate and share a CSV/Excel file
    const attendanceData = eventData.reservations.map((res: any) => ({
      id: res.id,
      participants: res.numberOfSpots,
      status: res.status,
      attendanceStatus: res.isCheckedIn ? 'checked-in' : 'no-show',
      checkInTime: res.checkInTime || 'N/A',
    }));
    
    Alert.alert(
      'Exportar Asistencia',
      `Datos de asistencia para "${eventData.event.title}":\n\n` +
      `Total reservas: ${eventData.totalReserved}\n` +
      `Check-ins: ${eventData.checkedIn}\n` +
      `Tasa asistencia: ${eventData.attendanceRate.toFixed(1)}%\n` +
      `Ingresos: €${eventData.revenue.toFixed(2)}`
    );
  };

  const getEventStatus = (event: Event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const eventDateTime = new Date(`${event.date} ${event.startTime}`);
    
    if (eventDateTime < now) return 'completed';
    if (eventDate.toDateString() === now.toDateString()) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'today': return Colors.warning;
      case 'upcoming': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const renderEventCard = ({ item }: { item: EventAttendanceData }) => {
    const status = getEventStatus(item.event);
    
    return (
      <TouchableScale
        style={styles.eventCard}
        onPress={() => handleViewEventDetails(item)}
      >
        <LinearGradient
          colors={[Colors.primary + '10', Colors.secondary + '10']}
          style={styles.eventGradient}
        >
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.event.title}</Text>
              <View style={styles.eventMeta}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.eventDate}>{item.event.date}</Text>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.eventTime}>{item.event.startTime}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>
                {status === 'completed' ? 'Finalizado' : 
                 status === 'today' ? 'Hoy' : 'Próximo'}
              </Text>
            </View>
          </View>

          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.statLabel}>Asistencia</Text>
              <Text style={styles.statValue}>
                {item.checkedIn}/{item.totalReserved}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <TrendingUp size={18} color={Colors.primary} />
              <Text style={styles.statLabel}>Tasa</Text>
              <Text style={styles.statValue}>
                {item.attendanceRate.toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.euroSymbol}>€</Text>
              <Text style={styles.statLabel}>Ingresos</Text>
              <Text style={styles.statValue}>
                {item.revenue.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewEventDetails(item)}
            >
              <Eye size={16} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Ver detalles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExportAttendance(item)}
            >
              <Download size={16} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Exportar</Text>
            </TouchableOpacity>
            
            <ChevronRight size={16} color={Colors.textSecondary} />
          </View>
        </LinearGradient>
      </TouchableScale>
    );
  };

  const renderReservationItem = ({ item }: { item: Reservation }) => (
    <TouchableScale style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.reservationInfo}>
          <User size={16} color={Colors.primary} />
          <Text style={styles.reservationId}>Reserva {item.id.substring(0, 8)}</Text>
        </View>
        <View style={[
          styles.attendanceStatus,
          { backgroundColor: item.isCheckedIn ? Colors.success : Colors.border }
        ]}>
          <Text style={[
            styles.attendanceStatusText,
            { color: item.isCheckedIn ? Colors.white : Colors.textSecondary }
          ]}>
            {item.isCheckedIn ? 'Presente' : 'Pendiente'}
          </Text>
        </View>
      </View>
      
      <View style={styles.reservationDetails}>
        <Text style={styles.reservationParticipants}>
          {item.numberOfSpots} participante{item.numberOfSpots > 1 ? 's' : ''}
        </Text>
        {item.checkInTime && (
          <Text style={styles.checkInTime}>
            Check-in: {new Date(item.checkInTime).toLocaleTimeString()}
          </Text>
        )}
      </View>
      
      {!item.isCheckedIn && (
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => handleManualCheckIn(item)}
        >
          <CheckCircle size={16} color={Colors.white} />
          <Text style={styles.checkInButtonText}>Check-in manual</Text>
        </TouchableOpacity>
      )}
    </TouchableScale>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Users size={24} color={Colors.white} />
              <Text style={styles.headerTitle}>Dashboard de Asistencia</Text>
            </View>
            
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <QrCode size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Resumen General</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{hostedEventsData.length}</Text>
                <Text style={styles.summaryLabel}>Eventos</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {hostedEventsData.reduce((sum: number, event: EventAttendanceData) => sum + event.totalReserved, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Reservas</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {hostedEventsData.reduce((sum: number, event: EventAttendanceData) => sum + event.checkedIn, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Check-ins</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  €{hostedEventsData.reduce((sum: number, event: EventAttendanceData) => sum + event.revenue, 0).toFixed(0)}
                </Text>
                <Text style={styles.summaryLabel}>Ingresos</Text>
              </View>
            </View>
          </View>

          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>Mis Eventos</Text>
            {hostedEventsData.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>No tienes eventos</Text>
                <Text style={styles.emptyStateText}>
                  Crea tu primer evento para comenzar a gestionar la asistencia
                </Text>
              </View>
            ) : (
              <FlatList
                data={hostedEventsData}
                renderItem={renderEventCard}
                keyExtractor={(item) => item.event.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Event Details Modal */}
        <Modal
          visible={showEventDetails}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          {selectedEvent && (
            <View style={styles.container}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.detailsHeader}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowEventDetails(false)}
                >
                  <X size={24} color={Colors.white} />
                </TouchableOpacity>
                
                <View style={styles.detailsHeaderContent}>
                  <Text style={styles.detailsTitle}>{selectedEvent.event.title}</Text>
                  <Text style={styles.detailsSubtitle}>
                    {selectedEvent.event.date} • {selectedEvent.event.startTime}
                  </Text>
                </View>
              </LinearGradient>

              <ScrollView style={styles.detailsContent}>
                <View style={styles.detailsStats}>
                  <View style={styles.detailsStat}>
                    <Users size={20} color={Colors.primary} />
                    <Text style={styles.detailsStatValue}>{selectedEvent.totalReserved}</Text>
                    <Text style={styles.detailsStatLabel}>Reservas totales</Text>
                  </View>
                  <View style={styles.detailsStat}>
                    <CheckCircle size={20} color={Colors.success} />
                    <Text style={styles.detailsStatValue}>{selectedEvent.checkedIn}</Text>
                    <Text style={styles.detailsStatLabel}>Presentes</Text>
                  </View>
                  <View style={styles.detailsStat}>
                    <TrendingUp size={20} color={Colors.warning} />
                    <Text style={styles.detailsStatValue}>{selectedEvent.attendanceRate.toFixed(1)}%</Text>
                    <Text style={styles.detailsStatLabel}>Asistencia</Text>
                  </View>
                </View>

                <View style={styles.reservationsList}>
                  <Text style={styles.reservationsTitle}>Reservas ({selectedEvent.reservations.length})</Text>
                  <FlatList
                    data={selectedEvent.reservations}
                    renderItem={renderReservationItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                  />
                </View>
              </ScrollView>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summarySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  eventsSection: {
    padding: 16,
    paddingTop: 0,
  },
  eventCard: {
    marginBottom: 16,
  },
  eventGradient: {
    borderRadius: 16,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  euroSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  detailsHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  detailsHeaderContent: {
    alignItems: 'center',
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  detailsSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  detailsContent: {
    flex: 1,
  },
  detailsStats: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
  },
  detailsStat: {
    alignItems: 'center',
    flex: 1,
  },
  detailsStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  detailsStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  reservationsList: {
    padding: 16,
    paddingTop: 0,
  },
  reservationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  reservationCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reservationId: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  attendanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reservationDetails: {
    marginBottom: 8,
  },
  reservationParticipants: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 12,
    color: Colors.success,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
});