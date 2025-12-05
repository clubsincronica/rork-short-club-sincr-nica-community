import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, Reservation, CartItem, UserCalendarSettings } from '@/types/user';
import { useUser } from '@/hooks/user-store';
import { mockCalendarEvents } from '@/mocks/data';
import { clearProblematicEvent } from '@/utils/clearProblematicData';
import { TicketGenerator } from '@/utils/ticketGenerator';

const STORAGE_KEYS = {
  EVENTS: 'calendar_events',
  RESERVATIONS: 'calendar_reservations',
  CART: 'calendar_cart',
  SETTINGS: 'calendar_settings',
};

const CalendarContext = createContext<any>(null);

export const CalendarProvider = ({ children }: { children: React.ReactNode }) => {
  const contextValue = useCalendarHook();
  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    // Return a safe default instead of throwing error during initialization
    console.warn('useCalendar called outside CalendarProvider, returning defaults');
    return {
      events: [],
      upcomingEvents: [],
      reservations: [],
      cart: [],
      settings: {
        isPublic: true,
        allowReservations: true,
        autoConfirmReservations: false,
        advanceBookingDays: 30,
        reminderHours: 24,
      },
      isLoading: true,
      addEvent: () => Promise.resolve(null),
      updateEvent: () => Promise.resolve(false),
      deleteEvent: () => Promise.resolve(false),
      createReservation: () => Promise.resolve(null),
      updateReservation: () => Promise.resolve(false),
      deleteReservation: () => Promise.resolve(false),
      addToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      updateSettings: () => Promise.resolve(false),
    };
  }
  return context;
};

const useCalendarHook = () => {
  // Safe user hook call with fallback
  let currentUser = null;
  try {
    const userHook = useUser();
    currentUser = userHook?.currentUser || null;
  } catch (error) {
    console.warn('UserProvider not ready in CalendarProvider:', error);
    currentUser = null;
  }
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<UserCalendarSettings>({
    isPublic: true,
    allowReservations: true,
    autoConfirmReservations: false,
    advanceBookingDays: 30,
    reminderHours: 24,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // First, clean up any problematic data that could cause crashes
      if (__DEV__) {
        console.log('🧹 Cleaning problematic data before loading...');
      }
      await clearProblematicEvent();
      
      const [eventsData, reservationsData, cartData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.RESERVATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.CART),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      // Load events from storage or use mock data if empty
      if (eventsData) {
        setEvents(JSON.parse(eventsData));
      } else {
        // Initialize with mock events for demonstration
        setEvents(mockCalendarEvents);
        await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(mockCalendarEvents));
      }
      
      if (reservationsData) {
        const loadedReservations = JSON.parse(reservationsData);
        console.log('📱 Loaded reservations from AsyncStorage:', loadedReservations);
        setReservations(loadedReservations);
      } else {
        console.log('📱 No reservations found in AsyncStorage');
        // Create a test reservation for debugging
        const testReservation: any = {
          id: 'test-reservation-' + Date.now(),
          eventId: '1761681416421', // The "Terapia Holística y Relajación" event
          event: events.find((e: any) => e.id === '1761681416421') || {
            id: '1761681416421',
            title: 'Terapia Holística y Relajación',
            price: 80,
            date: '2025-10-29',
            startTime: '16:00'
          },
          userId: currentUser?.id || '1',
          user: currentUser,
          status: 'confirmed' as const,
          numberOfSpots: 1,
          totalPrice: 80,
          paymentStatus: 'pending' as const,
          paymentMethod: 'credit-card',
          createdAt: new Date().toISOString(),
        };
        
        console.log('📱 Creating test reservation:', testReservation);
        const testReservations = [testReservation];
        await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(testReservations));
        setReservations(testReservations);
      }
      if (cartData) setCart(JSON.parse(cartData));
      if (settingsData) setSettings(JSON.parse(settingsData));
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading calendar data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save events to AsyncStorage
  const saveEvents = async (newEvents: CalendarEvent[]) => {
    try {
      console.log('Calendar Store: saveEvents called with', newEvents.length, 'events');
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(newEvents));
      setEvents(newEvents);
      console.log('Calendar Store: Events state updated, new length:', newEvents.length);
    } catch (error) {
      console.error('Calendar Store: Error saving events:', error);
      if (__DEV__) {
        console.error('Error saving events:', error);
      }
    }
  };

  // Add event
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id' | 'provider' | 'currentParticipants' | 'status'> & { provider?: any }) => {
    console.log('Calendar Store: addEvent called with:', event);
    
    if (!currentUser) {
      console.log('Calendar Store: No current user, cannot add event');
      return;
    }

    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
      // Use provided provider if available, otherwise use currentUser
      // This is important for reservations where the provider is NOT the person making the reservation
      provider: event.provider || currentUser,
      currentParticipants: 0,
      status: 'upcoming',
    };

    console.log('Calendar Store: Creating new event:', newEvent);
    console.log('Calendar Store: Event providerId:', newEvent.providerId);
    console.log('Calendar Store: Event provider name:', newEvent.provider?.name);
    
    const updatedEvents = [...events, newEvent];
    console.log('Calendar Store: Updated events array length:', updatedEvents.length);
    
    await saveEvents(updatedEvents);
    console.log('Calendar Store: Event saved successfully');
    
    return newEvent;
  }, [currentUser, events]);

  // Update event
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const updatedEvents = events.map(event =>
      event.id === eventId ? { ...event, ...updates } : event
    );
    await saveEvents(updatedEvents);
  }, [events]);

  // Delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    await saveEvents(updatedEvents);
  }, [events]);

  // Add to cart
  const addToCart = useCallback(async (eventId: string, numberOfSpots: number = 1, eventObject?: CalendarEvent) => {
    console.log('🛒 addToCart called with eventId:', eventId);
    console.log('🛒 Current events count:', events.length);
    console.log('🛒 Event object provided:', !!eventObject);
    
    // Use provided event object if available, otherwise look it up
    let event: CalendarEvent | undefined = eventObject;
    
    if (!event) {
      console.log('🛒 Looking for event in events array...');
      event = events.find(e => e.id === eventId);
    }
    
    if (!event) {
      console.error('❌ Event not found in events array:', eventId);
      console.log('📋 Available event IDs:', events.map(e => e.id).slice(0, 10));
      return;
    }
    
    console.log('✅ Event found:', event.title);

    const existingItem = cart.find(item => item.eventId === eventId);
    
    let updatedCart: CartItem[];
    if (existingItem) {
      console.log('📦 Updating existing cart item');
      updatedCart = cart.map(item =>
        item.eventId === eventId
          ? { ...item, numberOfSpots: item.numberOfSpots + numberOfSpots }
          : item
      );
    } else {
      console.log('📦 Adding new cart item');
      const newItem: CartItem = {
        eventId,
        event,
        numberOfSpots,
        price: event.price * numberOfSpots,
      };
      updatedCart = [...cart, newItem];
    }

    console.log('💾 Saving cart to storage, new count:', updatedCart.length);
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updatedCart));
    setCart(updatedCart);
    console.log('✅ Cart updated successfully');
  }, [cart, events]);

  // Remove from cart
  const removeFromCart = useCallback(async (eventId: string) => {
    const updatedCart = cart.filter(item => item.eventId !== eventId);
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updatedCart));
    setCart(updatedCart);
  }, [cart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    setCart([]);
  }, []);

  // Create reservation
  const createReservation = useCallback(async (eventIdOrEvent: string | CalendarEvent, numberOfSpots: number, paymentMethod: string) => {
    console.log('📝 Creating reservation for:', typeof eventIdOrEvent === 'string' ? 'eventId: ' + eventIdOrEvent : 'event object with id: ' + eventIdOrEvent.id, 'userId:', currentUser?.id);
    
    if (!currentUser) {
      console.warn('No current user found for reservation');
      return;
    }

    let event: CalendarEvent | undefined;
    if (typeof eventIdOrEvent === 'string') {
      // Find event by ID in the events array
      event = events.find(e => e.id === eventIdOrEvent);
      if (!event) {
        console.warn('Event not found for reservation:', eventIdOrEvent);
        return;
      }
    } else {
      // Use the provided event object directly
      event = eventIdOrEvent;
      console.log('📝 Using provided event object directly:', event.id);
    }

    const reservation: Reservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      event,
      userId: currentUser.id,
      user: currentUser,
      status: settings.autoConfirmReservations ? 'confirmed' : 'pending',
      numberOfSpots,
      totalPrice: event.price * numberOfSpots,
      paymentStatus: 'pending',
      paymentMethod,
      createdAt: new Date().toISOString(),
      isCheckedIn: false,
    };

    // Generate QR ticket for confirmed reservations
    if (reservation.status === 'confirmed') {
      try {
        const tickets = TicketGenerator.generateTicketsForReservation(reservation);
        if (tickets.length > 0) {
          reservation.ticketQRCode = tickets[0].qrCodeData; // Store first ticket's QR code
          console.log('🎫 Generated QR ticket for reservation:', reservation.id);
        }
      } catch (error) {
        console.error('Error generating QR ticket:', error);
      }
    }

    console.log('📝 Created reservation object:', reservation);
    
    const updatedReservations = [...reservations, reservation];
    console.log('📝 Updated reservations array:', updatedReservations);
    
    await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedReservations));
    setReservations(updatedReservations);

    // Update event participants count
    await updateEvent(event.id, {
      currentParticipants: event.currentParticipants + numberOfSpots,
    });

    return reservation;
  }, [currentUser, events, reservations, settings.autoConfirmReservations, updateEvent]);

  // Cancel reservation
  const cancelReservation = useCallback(async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const updatedReservations = reservations.map(r =>
      r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
    );
    await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedReservations));
    setReservations(updatedReservations);

    // Update event participants count
    const event = events.find(e => e.id === reservation.eventId);
    if (event) {
      await updateEvent(reservation.eventId, {
        currentParticipants: Math.max(0, event.currentParticipants - reservation.numberOfSpots),
      });
    }
  }, [reservations, events, updateEvent]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<UserCalendarSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
  }, [settings]);

  // Checkout cart
  const checkoutCart = useCallback(async (paymentMethod: string) => {
    const reservationPromises = cart.map(item =>
      createReservation(item.eventId, item.numberOfSpots, paymentMethod)
    );

    const createdReservations = await Promise.all(reservationPromises);
    await clearCart();
    return createdReservations;
  }, [cart, createReservation, clearCart]);

  // Get user's events
  const userEvents = useMemo(() => {
    if (!currentUser) return [];
    return events.filter(event => event.providerId === currentUser.id);
  }, [events, currentUser]);

  // Get user's reservations
  const userReservations = useMemo(() => {
    if (!currentUser) return [];
    return reservations.filter(r => r.userId === currentUser.id);
  }, [reservations, currentUser]);

  // Helper function to parse dates in multiple formats
  const parseEventDate = (dateString: string, timeString: string): Date | null => {
    try {
      if (__DEV__) {
        console.log('Calendar Store: parseEventDate called with:', dateString, timeString);
      }
      
      // Early validation
      if (!dateString || !timeString) {
        if (__DEV__) {
          console.warn('Calendar Store: Missing date or time string');
        }
        return null;
      }
      
      let finalDateString: string;
      
      // Check for DD/MM/YYYY format first to avoid the "Date value out of bounds" error
      if (dateString.includes('/')) {
        const dateParts = dateString.split('/');
        if (dateParts.length === 3 && dateParts[0].length <= 2) {
          // This looks like DD/MM/YYYY format, convert it first
          const [day, month, year] = dateParts;
          
          // Validate the parts before conversion
          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);
          
          if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
            if (__DEV__) {
              console.warn('Calendar Store: Invalid DD/MM/YYYY date parts:', day, month, year);
            }
            return null;
          }
          
          finalDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          if (__DEV__) {
            console.log('Calendar Store: Converting DD/MM/YYYY to ISO:', dateString, '->', finalDateString);
          }
        } else {
          if (__DEV__) {
            console.warn('Calendar Store: Invalid date format with slashes:', dateString);
          }
          return null;
        }
      } else {
        // Assume ISO format (YYYY-MM-DD)
        finalDateString = dateString;
      }
      
      // Create the full date-time string
      const fullDateTimeString = `${finalDateString}T${timeString}:00`;
      
      if (__DEV__) {
        console.log('Calendar Store: Creating Date object from:', fullDateTimeString);
      }
      
      // Create the Date object with additional protection
      const eventDate = new Date(fullDateTimeString);
      
      // Validate the created date
      if (isNaN(eventDate.getTime())) {
        if (__DEV__) {
          console.warn('Calendar Store: Invalid date created from:', fullDateTimeString);
        }
        return null;
      }
      
      return eventDate;
    } catch (error) {
      if (__DEV__) {
        console.error('Calendar Store: Error in parseEventDate:', error, 'Date:', dateString, 'Time:', timeString);
      }
      return null;
    }
  };

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    if (__DEV__) {
      console.log('Calendar Store: Computing upcoming events');
      console.log('Calendar Store: Total events:', events.length);
      console.log('Calendar Store: Current time:', now.toISOString());
    }
    
    const filtered = events.filter(event => {
      if (__DEV__) {
        console.log('Calendar Store: Checking event:', event.title, 'Date:', event.date, 'Time:', event.startTime, 'Status:', event.status);
      }
      
      let eventDate: Date | null;
      eventDate = parseEventDate(event.date, event.startTime);
      
      if (!eventDate) {
        if (__DEV__) {
          console.warn('Calendar Store: Failed to parse date for event:', event.title, 'Date:', event.date, 'Time:', event.startTime);
        }
        return false;
      }
      
      const isInFuture = eventDate > now;
      const isUpcoming = event.status === 'upcoming';
      
      if (__DEV__) {
        console.log('Calendar Store: Event date:', eventDate.toISOString(), 'isInFuture:', isInFuture, 'isUpcoming:', isUpcoming);
      }
      
      return isInFuture && isUpcoming;
    }).sort((a, b) => {
      const dateA = parseEventDate(a.date, a.startTime);
      const dateB = parseEventDate(b.date, b.startTime);
      
      // Handle invalid dates by putting them at the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA.getTime() - dateB.getTime();
    });
    
    if (__DEV__) {
      console.log('Calendar Store: Filtered upcoming events:', filtered.length);
    }
    return filtered;
  }, [events]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price, 0);
  }, [cart]);

  return useMemo(() => ({
    events,
    reservations,
    cart,
    settings,
    isLoading,
    userEvents,
    userReservations,
    upcomingEvents,
    cartTotal,
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
  }), [
    events,
    reservations,
    cart,
    settings,
    isLoading,
    userEvents,
    userReservations,
    upcomingEvents,
    cartTotal,
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
  ]);

  return {
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
  };
};

// Helper hook to get events for a specific date
export function useEventsForDate(date: string) {
  const { events } = useCalendar();
  return useMemo(() => {
    return events.filter((event: CalendarEvent) => event.date === date);
  }, [events, date]);
}

// Helper hook to get available spots for an event
export function useEventAvailability(eventId: string) {
  const { events } = useCalendar();
  const event = events.find((e: CalendarEvent) => e.id === eventId);
  
  if (!event) return { available: 0, total: 0, isFull: true };
  
  const available = event.maxParticipants - event.currentParticipants;
  return {
    available,
    total: event.maxParticipants,
    isFull: available <= 0,
  };
}
