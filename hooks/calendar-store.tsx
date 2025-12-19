import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent, Reservation, CartItem, UserCalendarSettings } from '@/types/user';
import type { User } from '../types/user';
import { useUser } from '@/hooks/user-store';
import { getApiBaseUrl } from '@/utils/api-config';
import { clearProblematicEvent } from '@/utils/clearProblematicData';
import { TicketGenerator } from '@/utils/ticketGenerator';

const STORAGE_KEYS = {
  // EVENTS key removed as we now fetch from API
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
      addToCart: () => { },
      removeFromCart: () => { },
      clearCart: () => { },
      updateSettings: () => Promise.resolve(false),
    };
  }
  return context;
};

const useCalendarHook = () => {
  // Safe user hook call with fallback
  let currentUser: User | null = null;
  try {
    const userHook = useUser();
    currentUser = userHook?.currentUser || null;
  } catch (error) {
    console.warn('UserProvider not ready in CalendarProvider:', error);
    currentUser = null;
  }
  const queryClient = useQueryClient();

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

  // Fetch events using TanStack Query
  const { data: events = [], isLoading: isEventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return await response.json();
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    }
  });

  // Load other local data
  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      setIsLoading(true);
      await clearProblematicEvent();

      const [reservationsData, cartData, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.RESERVATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.CART),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (reservationsData) setReservations(JSON.parse(reservationsData));
      if (cartData) setCart(JSON.parse(cartData));
      if (settingsData) setSettings(JSON.parse(settingsData));
    } catch (error) {
      console.error('Error loading local data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Event Mutation
  const addEventMutation = useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'provider' | 'currentParticipants' | 'status'> & { provider?: any }) => {
      if (!currentUser) throw new Error('No user logged in');

      const newEvent = {
        ...event,
        providerId: event.provider?.id || currentUser.id,
        status: 'upcoming',
        currentParticipants: 0,
        isOnline: event.isOnline || false,
        price: event.price || 0,
        maxParticipants: event.maxParticipants || 1,
        tags: event.tags || []
      };

      const response = await fetch(`${getApiBaseUrl()}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) throw new Error('Failed to create event');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Delete Event Mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`${getApiBaseUrl()}/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete event');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Update Event Mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string, updates: Partial<CalendarEvent> }) => {
      const response = await fetch(`${getApiBaseUrl()}/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update event');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });


  // Add event wrapper
  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'provider' | 'currentParticipants' | 'status'> & { provider?: any }) => {
    return await addEventMutation.mutateAsync(event);
  };

  // Update event wrapper
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      await updateEventMutation.mutateAsync({ eventId, updates });
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  }, [updateEventMutation]);

  // Delete event wrapper
  const deleteEvent = async (eventId: string) => {
    return await deleteEventMutation.mutateAsync(eventId);
  };

  // Add to cart
  const addToCart = useCallback(async (eventId: string, numberOfSpots: number = 1, eventObject?: CalendarEvent) => {
    console.log('🛒 addToCart called with eventId:', eventId);
    console.log('🛒 Current events count:', events.length);
    console.log('🛒 Event object provided:', !!eventObject);

    // Use provided event object if available, otherwise look it up
    let event: CalendarEvent | undefined = eventObject;

    if (!event) {
      console.log('🛒 Looking for event in events array...');
      event = events.find((e: CalendarEvent) => e.id === eventId);
    }

    if (!event) {
      console.error('❌ Event not found in events array:', eventId);
      console.log('📋 Available event IDs:', events.map((e: CalendarEvent) => e.id).slice(0, 10));
      return;
    }

    console.log('✅ Event found:', event.title);

    const existingItem = cart.find((item: CartItem) => item.eventId === eventId);

    let updatedCart: CartItem[];
    if (existingItem) {
      console.log('📦 Updating existing cart item');
      updatedCart = cart.map((item: CartItem) =>
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
    const updatedCart = cart.filter((item: CartItem) => item.eventId !== eventId);
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
      event = events.find((e: CalendarEvent) => e.id === eventIdOrEvent);
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
      userId: currentUser.id.toString(),
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
          reservation.ticketQRCode = tickets[0].qrData; // Store first ticket's QR code
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
    const reservation = reservations.find((r: Reservation) => r.id === reservationId);
    if (!reservation) return;

    const updatedReservations = reservations.map((r: Reservation) =>
      r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
    );
    await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedReservations));
    setReservations(updatedReservations);

    // Update event participants count
    const event = events.find((e: CalendarEvent) => e.id === reservation.eventId);
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
    const reservationPromises = cart.map((item: CartItem) =>
      createReservation(item.eventId, item.numberOfSpots, paymentMethod)
    );

    const createdReservations = await Promise.all(reservationPromises);
    await clearCart();
    return createdReservations;
  }, [cart, createReservation, clearCart]);

  // Get user's events
  const userEvents = useMemo(() => {
    if (!currentUser) return [];
    return events.filter((event: CalendarEvent) => event.providerId === currentUser.id.toString());
  }, [events, currentUser]);

  // Get user's reservations
  const userReservations = useMemo(() => {
    if (!currentUser) return [];
    return reservations.filter((r: Reservation) => r.userId === currentUser.id.toString());
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

    const filtered = events.filter((event: CalendarEvent) => {
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
    }).sort((a: CalendarEvent, b: CalendarEvent) => {
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
