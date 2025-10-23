import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, Reservation, CartItem, UserCalendarSettings } from '@/types/user';
import { useUser } from '@/hooks/user-store';
import { mockCalendarEvents } from '@/mocks/data';

const STORAGE_KEYS = {
  EVENTS: 'calendar_events',
  RESERVATIONS: 'calendar_reservations',
  CART: 'calendar_cart',
  SETTINGS: 'calendar_settings',
};

export const [CalendarProvider, useCalendar] = createContextHook(() => {
  const { currentUser } = useUser();
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
      
      if (reservationsData) setReservations(JSON.parse(reservationsData));
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
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving events:', error);
      }
    }
  };

  // Add event
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id' | 'provider' | 'currentParticipants' | 'status'>) => {
    if (!currentUser) return;

    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
      provider: currentUser,
      currentParticipants: 0,
      status: 'upcoming',
    };

    const updatedEvents = [...events, newEvent];
    await saveEvents(updatedEvents);
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
  const addToCart = useCallback(async (eventId: string, numberOfSpots: number = 1) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const existingItem = cart.find(item => item.eventId === eventId);
    
    let updatedCart: CartItem[];
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.eventId === eventId
          ? { ...item, numberOfSpots: item.numberOfSpots + numberOfSpots }
          : item
      );
    } else {
      const newItem: CartItem = {
        eventId,
        event,
        numberOfSpots,
        price: event.price * numberOfSpots,
      };
      updatedCart = [...cart, newItem];
    }

    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(updatedCart));
    setCart(updatedCart);
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
  const createReservation = useCallback(async (eventId: string, numberOfSpots: number, paymentMethod: string) => {
    if (!currentUser) return;

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const reservation: Reservation = {
      id: Date.now().toString(),
      eventId,
      event,
      userId: currentUser.id,
      user: currentUser,
      status: settings.autoConfirmReservations ? 'confirmed' : 'pending',
      numberOfSpots,
      totalPrice: event.price * numberOfSpots,
      paymentStatus: 'pending',
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    const updatedReservations = [...reservations, reservation];
    await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updatedReservations));
    setReservations(updatedReservations);

    // Update event participants count
    await updateEvent(eventId, {
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
      
      let eventDate: Date;
      try {
        eventDate = new Date(`${event.date}T${event.startTime}:00`);
      } catch (error) {
        if (__DEV__) {
          console.log('Calendar Store: Error parsing date for event:', event.title, error);
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
      const dateA = new Date(`${a.date}T${a.startTime}:00`);
      const dateB = new Date(`${b.date}T${b.startTime}:00`);
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
});

// Helper hook to get events for a specific date
export function useEventsForDate(date: string) {
  const { events } = useCalendar();
  return useMemo(() => {
    return events.filter(event => event.date === date);
  }, [events, date]);
}

// Helper hook to get available spots for an event
export function useEventAvailability(eventId: string) {
  const { events } = useCalendar();
  const event = events.find(e => e.id === eventId);
  
  if (!event) return { available: 0, total: 0, isFull: true };
  
  const available = event.maxParticipants - event.currentParticipants;
  return {
    available,
    total: event.maxParticipants,
    isFull: available <= 0,
  };
}
