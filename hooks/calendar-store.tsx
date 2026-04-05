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
      providerReservations: [],
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
      updateAttendance: () => Promise.resolve(false),
      addToCart: () => { },
      removeFromCart: () => { },
      clearCart: () => { },
      updateSettings: () => Promise.resolve(false),
      refetch: () => Promise.resolve(),
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

  // Fetch provider reservations
  const { data: providerReservations = [], isLoading: isProviderReservationsLoading, refetch: refetchProviderReservations } = useQuery({
    queryKey: ['provider-reservations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/reservations/provider/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch provider reservations');
        return await response.json();
      } catch (error) {
        console.error('Error fetching provider reservations:', error);
        return [];
      }
    },
    enabled: !!currentUser
  });

  const refetch = async () => {
    await Promise.all([refetchEvents(), refetchProviderReservations()]);
  };

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

      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      return null;
    }

    let event: CalendarEvent | undefined;
    if (typeof eventIdOrEvent === 'string') {
      event = events.find((e: CalendarEvent) => e.id === eventIdOrEvent);
      if (!event) {
        console.warn('Event not found for reservation:', eventIdOrEvent);
        return null;
      }
    } else {
      event = eventIdOrEvent;
      console.log('📝 Using provided event object directly:', event.id);
    }

    const reservationData = {
      eventId: parseInt(event.id),
      userId: currentUser.id,
      providerId: parseInt(event.providerId),
      status: 'confirmed',
      numberOfSpots,
      totalPrice: event.price * numberOfSpots,
      paymentStatus: paymentMethod === 'free' ? 'completed' : 'pending',
      paymentMethod,
      notes: ''
    };

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reservationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation on server');
      }

      const result = await response.json();

      const reservation: Reservation = {
        id: result.id.toString(),
        eventId: event.id,
        event,
        userId: currentUser.id.toString(),
        user: currentUser,
        status: 'confirmed',
        numberOfSpots,
        totalPrice: reservationData.totalPrice,
        paymentStatus: reservationData.paymentStatus as any,
        paymentMethod,
        createdAt: new Date().toISOString(),
        isCheckedIn: false,
      };

      // Generate QR ticket for confirmed reservations
      if (reservation.status === 'confirmed') {
        try {
          const tickets = TicketGenerator.generateTicketsForReservation(reservation);
          if (tickets.length > 0) {
            reservation.ticketQRCode = tickets[0].qrData;
            console.log('🎫 Generated QR ticket for reservation:', reservation.id);
          }
        } catch (error) {
          console.error('Error generating QR ticket:', error);
        }
      }

      const updatedReservations = [...reservations, reservation];
      await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedReservations));
      setReservations(updatedReservations);

      // Update event participants count
      await updateEvent(event.id, {
        currentParticipants: event.currentParticipants + numberOfSpots,
      });

      return reservation;
    } catch (error) {
      console.error('❌ Error creating reservation:', error);
      return null;
    }
  }, [currentUser, events, reservations, updateEvent]);

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

  // Update attendance
  const updateAttendance = useCallback(async (reservationId: string, attended: boolean) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/reservations/${reservationId}/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attended })
      });

      if (!response.ok) throw new Error('Failed to update attendance');

      const updatedReservations = reservations.map((r: Reservation) =>
        r.id === reservationId ? { ...r, isCheckedIn: attended, checkInTime: attended ? new Date().toISOString() : undefined } : r
      );

      await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedReservations));
      setReservations(updatedReservations);
      return true;
    } catch (error) {
      console.error('Error updating attendance:', error);
      return false;
    }
  }, [reservations]);

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
    return events.filter((event: CalendarEvent) => String(event.providerId) === String(currentUser.id));
  }, [events, currentUser]);

  // Get user's reservations
  const userReservations = useMemo(() => {
    if (!currentUser) return [];
    return reservations.filter((r: Reservation) => String(r.userId) === String(currentUser.id));
  }, [reservations, currentUser]);

  // Helper function to parse dates in multiple formats
  const parseEventDate = (dateString: string, timeString: string): Date | null => {
    try {
      // Early validation
      if (!dateString || !timeString) {
        return null;
      }

      let finalDateString: string = dateString;

      // Handle common date separators and formats (DD/MM/YYYY or DD-MM-YYYY)
      if (dateString.includes('/') || (dateString.includes('-') && dateString.split('-')[0].length <= 2)) {
        const separator = dateString.includes('/') ? '/' : '-';
        const dateParts = dateString.split(separator);
        
        if (dateParts.length === 3) {
          // If first part is not a 4-digit year, it's likely DD/MM/YYYY
          if (dateParts[0].length !== 4) {
            const [day, month, year] = dateParts;
            finalDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
      }

      // Create the full ISO date-time string
      // Append 'Z' or use local date parsing depending on the environment
      // Using a space instead of 'T' can be more reliable on some JS engines
      const fullDateTimeString = `${finalDateString.replace(/\//g, '-')}T${timeString}:00`;
      const eventDate = new Date(fullDateTimeString);

      // Validate the created date
      if (isNaN(eventDate.getTime())) {
        // Fallback for some environments that don't like 'T' separator
        const fallbackDate = new Date(finalDateString.replace(/\//g, '-') + ' ' + timeString);
        if (!isNaN(fallbackDate.getTime())) {
          return fallbackDate;
        }
        return null;
      }

      return eventDate;
    } catch (error) {
      return null;
    }
  };

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    
    // Sort and filter events
    const filtered = events.filter((event: CalendarEvent) => {
      let eventDate: Date | null = parseEventDate(event.date, event.startTime);
      const isUpcoming = event.status === 'upcoming';
      
      // If we can't parse the date, trust the 'upcoming' status
      if (!eventDate) {
        return isUpcoming;
      }

      const isInFuture = eventDate > now;
      
      // Show if it's in the future OR if it's explicitly marked as upcoming
      return isInFuture || isUpcoming;
    }).sort((a: CalendarEvent, b: CalendarEvent) => {
      const dateA = parseEventDate(a.date, a.startTime);
      const dateB = parseEventDate(b.date, b.startTime);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateA.getTime() - dateB.getTime();
    });

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
    providerReservations,
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
    updateAttendance,
  }), [
    events,
    reservations,
    providerReservations,
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
    updateAttendance,
  ]);

  return {
    events,
    userEvents,
    userReservations,
    providerReservations,
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
    updateAttendance,
    refetch,
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
