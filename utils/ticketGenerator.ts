import { EventTicket, Reservation, CalendarEvent, User } from '@/types/user';

export class TicketGenerator {
  // Generate QR code data for a ticket
  static generateQRData(ticket: EventTicket): string {
    const qrData = {
      type: 'CLUB_SINCRONICA_TICKET',
      version: '1.0',
      ticketId: ticket.id,
      eventId: ticket.eventId,
      reservationId: ticket.reservationId,
      attendeeName: ticket.attendeeName,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      eventTime: ticket.eventTime,
      eventLocation: ticket.eventLocation,
      price: ticket.price,
      ticketType: ticket.ticketType,
      issuedAt: new Date().toISOString(),
      // Security checksum to prevent tampering
      checksum: this.generateChecksum(ticket)
    };

    return JSON.stringify(qrData);
  }

  // Generate a unique ticket from a reservation
  static generateTicket(
    reservation: Reservation, 
    attendeeIndex: number = 0
  ): EventTicket {
    const ticketId = `TKT-${reservation.id}-${attendeeIndex + 1}`;
    
    const ticket: EventTicket = {
      id: ticketId,
      reservationId: reservation.id,
      eventId: reservation.eventId,
      eventTitle: reservation.event.title,
      eventDate: reservation.event.date,
      eventTime: reservation.event.startTime,
      eventLocation: reservation.event.location || 'Ubicación por confirmar',
      attendeeName: reservation.user.name,
      attendeeEmail: reservation.user.email,
      ticketType: 'standard',
      price: reservation.totalPrice / reservation.numberOfSpots, // Price per ticket
      qrCodeData: '', // Will be generated after ticket creation
      isScanned: false,
    };

    // Generate QR code data
    ticket.qrCodeData = this.generateQRData(ticket);

    return ticket;
  }

  // Generate multiple tickets for a reservation (if numberOfSpots > 1)
  static generateTicketsForReservation(reservation: Reservation): EventTicket[] {
    const tickets: EventTicket[] = [];
    
    for (let i = 0; i < reservation.numberOfSpots; i++) {
      tickets.push(this.generateTicket(reservation, i));
    }
    
    return tickets;
  }

  // Validate QR code data
  static validateQRData(qrData: string): { valid: boolean; ticket?: any; error?: string } {
    try {
      const data = JSON.parse(qrData);
      
      // Check if it's a Club Sincrónica ticket
      if (data.type !== 'CLUB_SINCRONICA_TICKET') {
        return { valid: false, error: 'No es un ticket de Club Sincrónica' };
      }
      
      // Check version compatibility
      if (data.version !== '1.0') {
        return { valid: false, error: 'Versión de ticket no compatible' };
      }
      
      // Validate required fields
      const requiredFields = [
        'ticketId', 'eventId', 'reservationId', 'attendeeName', 
        'eventTitle', 'eventDate', 'eventTime', 'checksum'
      ];
      
      for (const field of requiredFields) {
        if (!data[field]) {
          return { valid: false, error: `Campo requerido faltante: ${field}` };
        }
      }
      
      // Validate checksum (basic validation)
      const expectedChecksum = this.generateSimpleChecksum(data);
      if (data.checksum !== expectedChecksum) {
        return { valid: false, error: 'Ticket inválido o modificado' };
      }
      
      return { valid: true, ticket: data };
    } catch (error) {
      return { valid: false, error: 'Formato de ticket inválido' };
    }
  }

  // Generate checksum for security (basic implementation)
  private static generateChecksum(ticket: EventTicket): string {
    const dataString = `${ticket.id}${ticket.eventId}${ticket.reservationId}${ticket.attendeeName}${ticket.eventDate}${ticket.price}`;
    return this.simpleHash(dataString);
  }

  // Generate simple checksum for validation
  private static generateSimpleChecksum(data: any): string {
    const dataString = `${data.ticketId}${data.eventId}${data.reservationId}${data.attendeeName}${data.eventDate}${data.price}`;
    return this.simpleHash(dataString);
  }

  // Simple hash function (for demo - in production use crypto)
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Generate human-readable ticket info
  static getTicketDisplayInfo(qrData: string): string {
    const validation = this.validateQRData(qrData);
    
    if (!validation.valid || !validation.ticket) {
      return 'Ticket inválido';
    }

    const ticket = validation.ticket;
    return `🎫 ${ticket.eventTitle}
📅 ${new Date(ticket.eventDate).toLocaleDateString('es-ES')} - ${ticket.eventTime}
👤 ${ticket.attendeeName}
📍 ${ticket.eventLocation}
💰 €${ticket.price}
🔢 ID: ${ticket.ticketId}`;
  }
}

// Attendance tracking utilities
export class AttendanceManager {
  private static ATTENDANCE_STORAGE_KEY = 'event_attendance_records';

  // Check in a ticket
  static async checkInTicket(
    eventId: string, 
    ticketQRData: string, 
    location?: string
  ): Promise<{ success: boolean; message: string; ticket?: any }> {
    
    const validation = TicketGenerator.validateQRData(ticketQRData);
    
    if (!validation.valid || !validation.ticket) {
      return { 
        success: false, 
        message: validation.error || 'Ticket inválido' 
      };
    }

    const ticket = validation.ticket;

    // Check if ticket belongs to this event
    if (ticket.eventId !== eventId) {
      return { 
        success: false, 
        message: 'Este ticket no corresponde a este evento' 
      };
    }

    // Check if already scanned
    if (ticket.isScanned) {
      return { 
        success: false, 
        message: `Ticket ya escaneado el ${ticket.scanTime}`,
        ticket 
      };
    }

    // Mark as scanned
    ticket.isScanned = true;
    ticket.scanTime = new Date().toISOString();
    ticket.scanLocation = location || 'Entrada principal';

    // Update attendance record
    await this.updateAttendanceRecord(eventId, ticket);

    return { 
      success: true, 
      message: `¡Bienvenido/a ${ticket.attendeeName}!`,
      ticket 
    };
  }

  // Update attendance record
  private static async updateAttendanceRecord(eventId: string, ticket: any) {
    try {
      // In a real app, this would update your backend/database
      // For now, we'll use AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      const stored = await AsyncStorage.getItem(this.ATTENDANCE_STORAGE_KEY);
      const records = stored ? JSON.parse(stored) : {};
      
      if (!records[eventId]) {
        records[eventId] = {
          eventId,
          totalTickets: 0,
          scannedTickets: 0,
          checkInRate: 0,
          lastUpdated: new Date().toISOString(),
          attendees: []
        };
      }
      
      const eventRecord = records[eventId];
      
      // Add or update attendee
      const existingAttendeeIndex = eventRecord.attendees.findIndex(
        (a: any) => a.ticketId === ticket.ticketId
      );
      
      const attendeeData = {
        ticketId: ticket.ticketId,
        attendeeName: ticket.attendeeName,
        checkInTime: ticket.scanTime,
        status: 'checked-in' as const
      };
      
      if (existingAttendeeIndex >= 0) {
        eventRecord.attendees[existingAttendeeIndex] = attendeeData;
      } else {
        eventRecord.attendees.push(attendeeData);
      }
      
      // Update statistics
      eventRecord.scannedTickets = eventRecord.attendees.filter(
        (a: any) => a.status === 'checked-in'
      ).length;
      
      eventRecord.checkInRate = eventRecord.totalTickets > 0 
        ? (eventRecord.scannedTickets / eventRecord.totalTickets) * 100 
        : 0;
        
      eventRecord.lastUpdated = new Date().toISOString();
      
      await AsyncStorage.setItem(this.ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
      
    } catch (error) {
      console.error('Error updating attendance record:', error);
    }
  }

  // Get attendance stats for an event
  static async getEventAttendance(eventId: string) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(this.ATTENDANCE_STORAGE_KEY);
      const records = stored ? JSON.parse(stored) : {};
      
      return records[eventId] || {
        eventId,
        totalTickets: 0,
        scannedTickets: 0,
        checkInRate: 0,
        lastUpdated: new Date().toISOString(),
        attendees: []
      };
    } catch (error) {
      console.error('Error getting attendance data:', error);
      return null;
    }
  }
}

export default TicketGenerator;