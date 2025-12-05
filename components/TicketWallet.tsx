import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Image,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { 
  QrCode as TicketIcon, 
  Calendar, 
  Clock, 
  MapPin, 
  Share as ShareIcon, 
  Download,
  X,
  ChevronRight,
  QrCode,
  Users,
  Euro
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { useCalendar } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';
import { TicketGenerator } from '@/utils/ticketGenerator';
import { Reservation } from '@/types/user';
import { TouchableScale } from '@/components/TouchableScale';

const { width: screenWidth } = Dimensions.get('window');

interface TicketWalletProps {
  visible: boolean;
  onClose: () => void;
}

interface TicketDisplayData {
  reservation: Reservation;
  qrData: string;
  ticketInfo: any;
}

export function TicketWallet({ visible, onClose }: TicketWalletProps) {
  const { userReservations } = useCalendar();
  const { currentUser } = useUser();
  const [selectedTicket, setSelectedTicket] = useState<TicketDisplayData | null>(null);

  // Get confirmed reservations with QR tickets
  const ticketsData = useMemo(() => {
    if (!currentUser) return [];
    
    return userReservations
      .filter((reservation: Reservation) =>
        reservation.status === 'confirmed' && 
        reservation.ticketQRCode
      )
      .map((reservation: Reservation) => {
        const validation = TicketGenerator.validateQRData(reservation.ticketQRCode!);
        return {
          reservation,
          qrData: reservation.ticketQRCode!,
          ticketInfo: validation.valid ? validation.ticket : null,
        };
      })
      .filter((ticket: TicketDisplayData) => ticket.ticketInfo);
  }, [userReservations, currentUser]);

  const handleShareTicket = async (ticket: TicketDisplayData) => {
    try {
      await Share.share({
        message: `Mi entrada para ${ticket.reservation.event.title}\n\nFecha: ${new Date(ticket.reservation.event.date).toLocaleDateString('es-ES')}\nHora: ${ticket.reservation.event.startTime}\n\nClub Sincrónica`,
        title: 'Entrada de Evento'
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isEventPast = (dateString: string, timeString: string) => {
    const eventDate = new Date(`${dateString}T${timeString}:00`);
    return eventDate < new Date();
  };

  const isEventSoon = (dateString: string, timeString: string) => {
    const eventDate = new Date(`${dateString}T${timeString}:00`);
    const now = new Date();
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  return (
    <>
      {/* Main Ticket Wallet Modal */}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.headerTitle}>
                <TicketIcon size={24} color={Colors.white} />
                <Text style={styles.headerText}>Mis Entradas</Text>
              </View>
              <View style={styles.placeholder} />
            </View>
          </LinearGradient>

          {/* Tickets List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {ticketsData.length === 0 ? (
              <View style={styles.emptyState}>
                <QrCode size={64} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>No tienes entradas</Text>
                <Text style={styles.emptySubtitle}>
                  Cuando reserves eventos confirmados, tus entradas QR aparecerán aquí
                </Text>
              </View>
            ) : (
              ticketsData.map((ticket: TicketDisplayData, index: number) => {
                const event = ticket.reservation.event;
                const isPast = isEventPast(event.date, event.startTime);
                const isSoon = isEventSoon(event.date, event.startTime);
                
                return (
                  <TouchableScale
                    key={ticket.reservation.id}
                    style={[
                      styles.ticketCard,
                      isPast && styles.ticketCardPast,
                      isSoon && styles.ticketCardSoon
                    ]}
                    onPress={() => setSelectedTicket(ticket)}
                  >
                    {/* Status Badge */}
                    {isSoon && (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonBadgeText}>¡Próximo!</Text>
                      </View>
                    )}
                    
                    {isPast && (
                      <View style={styles.pastBadge}>
                        <Text style={styles.pastBadgeText}>Finalizado</Text>
                      </View>
                    )}

                    {/* Ticket Content */}
                    <View style={styles.ticketHeader}>
                      <View style={styles.ticketInfo}>
                        <Text style={[styles.eventTitle, isPast && styles.eventTitlePast]}>
                          {event.title}
                        </Text>
                        <View style={styles.eventDetails}>
                          <View style={styles.eventDetail}>
                            <Calendar size={14} color={isPast ? Colors.textLight : Colors.primary} />
                            <Text style={[styles.eventDetailText, isPast && styles.eventDetailTextPast]}>
                              {formatEventDate(event.date)}
                            </Text>
                          </View>
                          <View style={styles.eventDetail}>
                            <Clock size={14} color={isPast ? Colors.textLight : Colors.primary} />
                            <Text style={[styles.eventDetailText, isPast && styles.eventDetailTextPast]}>
                              {event.startTime}
                            </Text>
                          </View>
                          {event.location && (
                            <View style={styles.eventDetail}>
                              <MapPin size={14} color={isPast ? Colors.textLight : Colors.primary} />
                              <Text style={[styles.eventDetailText, isPast && styles.eventDetailTextPast]}>
                                {event.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.ticketActions}>
                        <View style={styles.qrPreview}>
                          <QRCode
                            value={ticket.qrData}
                            size={40}
                            backgroundColor="transparent"
                            color={isPast ? Colors.textLight : Colors.primary}
                          />
                        </View>
                        <ChevronRight size={16} color={Colors.textLight} />
                      </View>
                    </View>

                    {/* Ticket Footer */}
                    <View style={styles.ticketFooter}>
                      <View style={styles.ticketMeta}>
                        <Users size={12} color={Colors.textLight} />
                        <Text style={styles.ticketMetaText}>
                          {ticket.reservation.numberOfSpots} plaza(s)
                        </Text>
                      </View>
                      <View style={styles.ticketMeta}>
                        <Euro size={12} color={Colors.textLight} />
                        <Text style={styles.ticketMetaText}>
                          €{ticket.reservation.totalPrice}
                        </Text>
                      </View>
                      {ticket.reservation.isCheckedIn && (
                        <View style={styles.checkedInBadge}>
                          <Text style={styles.checkedInText}>✓ Asistió</Text>
                        </View>
                      )}
                    </View>
                  </TouchableScale>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Full Ticket Display Modal */}
      {selectedTicket && (
        <Modal 
          visible={!!selectedTicket} 
          animationType="slide" 
          presentationStyle="pageSheet"
        >
          <View style={styles.ticketDisplayContainer}>
            {/* Header */}
            <View style={styles.ticketDisplayHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setSelectedTicket(null)}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.ticketDisplayTitle}>Entrada QR</Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => handleShareTicket(selectedTicket)}
              >
                <ShareIcon size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* QR Ticket Display */}
            <ScrollView style={styles.ticketDisplayContent} showsVerticalScrollIndicator={false}>
              <View style={styles.qrTicketCard}>
                {/* Event Info */}
                <View style={styles.qrEventInfo}>
                  <Text style={styles.qrEventTitle}>{selectedTicket.reservation.event.title}</Text>
                  <Text style={styles.qrEventDate}>
                    {formatEventDate(selectedTicket.reservation.event.date)}
                  </Text>
                  <Text style={styles.qrEventTime}>
                    {selectedTicket.reservation.event.startTime}
                  </Text>
                  {selectedTicket.reservation.event.location && (
                    <Text style={styles.qrEventLocation}>
                      📍 {selectedTicket.reservation.event.location}
                    </Text>
                  )}
                </View>

                {/* QR Code */}
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={selectedTicket.qrData}
                    size={200}
                    backgroundColor={Colors.white}
                    color={Colors.primary}
                    logo={require('@/assets/images/icon.png')}
                    logoSize={30}
                    logoBackgroundColor={Colors.white}
                    logoMargin={2}
                  />
                </View>

                {/* Ticket Details */}
                <View style={styles.ticketDetails}>
                  <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Titular:</Text>
                    <Text style={styles.ticketDetailValue}>
                      {selectedTicket.reservation.user.name}
                    </Text>
                  </View>
                  <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Plazas:</Text>
                    <Text style={styles.ticketDetailValue}>
                      {selectedTicket.reservation.numberOfSpots}
                    </Text>
                  </View>
                  <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Total:</Text>
                    <Text style={styles.ticketDetailValue}>
                      €{selectedTicket.reservation.totalPrice}
                    </Text>
                  </View>
                  <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>ID Reserva:</Text>
                    <Text style={styles.ticketDetailValue}>
                      {selectedTicket.reservation.id.slice(-8)}
                    </Text>
                  </View>
                  {selectedTicket.reservation.isCheckedIn && (
                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Check-in:</Text>
                      <Text style={[styles.ticketDetailValue, styles.checkedInValue]}>
                        ✓ Realizado
                      </Text>
                    </View>
                  )}
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>Instrucciones:</Text>
                  <Text style={styles.instructionsText}>
                    • Muestra este código QR en la entrada del evento{'\n'}
                    • El organizador escaneará tu entrada para confirmar tu asistencia{'\n'}
                    • Llega 10-15 minutos antes del evento{'\n'}
                    • Guarda una captura de pantalla como respaldo
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
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
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  ticketCardPast: {
    opacity: 0.7,
    borderLeftColor: Colors.textLight,
  },
  ticketCardSoon: {
    borderLeftColor: Colors.warning,
    backgroundColor: Colors.warning + '05',
  },
  soonBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: Colors.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  pastBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: Colors.textLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  pastBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ticketInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  eventTitlePast: {
    color: Colors.textLight,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: Colors.text,
  },
  eventDetailTextPast: {
    color: Colors.textLight,
  },
  ticketActions: {
    alignItems: 'center',
    gap: 8,
  },
  qrPreview: {
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketMetaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  checkedInBadge: {
    backgroundColor: Colors.success + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  checkedInText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  // Full ticket display styles
  ticketDisplayContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ticketDisplayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  ticketDisplayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  shareButton: {
    padding: 8,
  },
  ticketDisplayContent: {
    flex: 1,
    padding: 20,
  },
  qrTicketCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  qrEventInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrEventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  qrEventDate: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  qrEventTime: {
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  qrEventLocation: {
    fontSize: 14,
    color: Colors.textLight,
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketDetails: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketDetailLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  ticketDetailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  checkedInValue: {
    color: Colors.success,
  },
  instructions: {
    width: '100%',
    backgroundColor: Colors.primaryLight + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
});