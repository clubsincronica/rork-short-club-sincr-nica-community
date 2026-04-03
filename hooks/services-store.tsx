import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/utils/api-config';
import { useUser } from '@/hooks/user-store';

export interface ServiceSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  maxSlots?: number; // How many slots per time period
}

export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number; // minutes
  isOnline: boolean;
  location?: string;
  images?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;      // Whether this service is active/visible
  
  // New calendar integration fields
  startDate?: string;      // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD  
  schedule?: ServiceSchedule[]; // Recurring schedule
  isScheduled: boolean;    // Whether this service has calendar integration
}

export interface ServiceReservation {
  id: string;
  serviceId: string;
  providerId: string;
  clientId: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

interface ServicesContextType {
  services: Service[];
  reservations: ServiceReservation[];
  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  getUserServices: (userId: string) => Service[];
  getServicesByCategory: (category: string) => Service[];
  
  // Calendar integration
  getServiceCalendarEvents: (serviceId: string) => any[];
  getAllServiceCalendarEvents: (userId: string) => any[];
  
  // Reservation methods
  createReservation: (reservation: Omit<ServiceReservation, 'id' | 'createdAt'>) => Promise<void>;
  updateReservationStatus: (id: string, status: ServiceReservation['status']) => Promise<void>;
  getServiceReservations: (serviceId: string) => ServiceReservation[];
  getUserReservations: (userId: string, type: 'provider' | 'client') => ServiceReservation[];
  isLoading: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

const SERVICES_STORAGE_KEY = '@rork_services';
const RESERVATIONS_STORAGE_KEY = '@rork_reservations';

export const ServicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const [reservations, setReservations] = useState<ServiceReservation[]>([]);

  // Fetch services from API
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/services`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return await response.json();
    }
  });

  // Load reservations from storage (keeping them local for now as per plan focus)
  useEffect(() => {
    const loadReservations = async () => {
      try {
        const storedReservations = await AsyncStorage.getItem(RESERVATIONS_STORAGE_KEY);
        if (storedReservations) {
          setReservations(JSON.parse(storedReservations));
        }
      } catch (error) {
        console.error('📋 Services Store: Error loading reservations:', error);
      }
    };
    loadReservations();
  }, []);

  const saveReservations = async (updatedReservations: ServiceReservation[]) => {
    try {
      await AsyncStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(updatedReservations));
    } catch (error) {
      console.error('📋 Services Store: Error saving reservations:', error);
    }
  };

  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update service');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete service');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const addService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addServiceMutation.mutateAsync(serviceData);
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    await updateServiceMutation.mutateAsync({ id, updates });
  };

  const deleteService = async (id: string) => {
    await deleteServiceMutation.mutateAsync(id);
  };

  const getUserServices = (userId: string): Service[] => {
    const userServices = services.filter((service: Service) => service.providerId === userId);
    return userServices;
  };

  const getServicesByCategory = (category: string): Service[] => {
    return services.filter((service: Service) => service.category === category);
  };

  const createReservation = async (reservationData: Omit<ServiceReservation, 'id' | 'createdAt'>) => {
    try {
      const newReservation: ServiceReservation = {
        ...reservationData,
        id: `reservation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updatedReservations = [...reservations, newReservation];
      setReservations(updatedReservations);
      await saveReservations(updatedReservations);
    } catch (error) {
      console.error('📋 Services Store: Error creating reservation:', error);
      throw error;
    }
  };

  const updateReservationStatus = async (id: string, status: ServiceReservation['status']) => {
    try {
      const updatedReservations = reservations.map((reservation: ServiceReservation) =>
        reservation.id === id
          ? { ...reservation, status }
          : reservation
      );
      
      setReservations(updatedReservations);
      await saveReservations(updatedReservations);
    } catch (error) {
      console.error('📋 Services Store: Error updating reservation status:', error);
      throw error;
    }
  };

  const getServiceReservations = (serviceId: string): ServiceReservation[] => {
    return reservations.filter((reservation: ServiceReservation) => reservation.serviceId === serviceId);
  };

  const getUserReservations = (userId: string, type: 'provider' | 'client'): ServiceReservation[] => {
    const key = type === 'provider' ? 'providerId' : 'clientId';
    return reservations.filter((reservation: ServiceReservation) => reservation[key] === userId);
  };

  // Generate calendar events from service schedules
  const generateDatesBetween = (startDate: string, endDate: string): Date[] => {
    const dates: Date[] = [];
    
    // Convert DD/MM/YYYY to YYYY-MM-DD format for proper Date parsing
    const convertDate = (dateStr: string): Date => {
      if (dateStr.includes('/')) {
        // DD/MM/YYYY format
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        // Already in YYYY-MM-DD format
        return new Date(dateStr);
      }
    };
    
    const start = convertDate(startDate);
    const end = convertDate(endDate);
    
    console.log('🔍 generateDatesBetween: Converting dates', {
      startDate,
      endDate,
      startConverted: start.toISOString(),
      endConverted: end.toISOString(),
      isValidStart: !isNaN(start.getTime()),
      isValidEnd: !isNaN(end.getTime())
    });
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('🔍 generateDatesBetween: Invalid date format', { startDate, endDate });
      return dates;
    }
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    
    console.log('🔍 generateDatesBetween: Generated', dates.length, 'dates');
    return dates;
  };

  const getServiceCalendarEvents = (serviceId: string): any[] => {
    const service = services.find((s: Service) => s.id === serviceId);
    if (!service || !service.isScheduled || !service.schedule || !service.startDate || !service.endDate) {
      return [];
    }

    const events: any[] = [];
    const dates = generateDatesBetween(service.startDate, service.endDate);
    
    dates.forEach(date => {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find schedules for this day of week
      const daySchedules = service.schedule!.filter((schedule: ServiceSchedule) => schedule.dayOfWeek === dayOfWeek);
      
      daySchedules.forEach((schedule: ServiceSchedule) => {
        const eventDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        events.push({
          id: `service-slot-${service.id}-${eventDate}-${schedule.startTime}`,
          serviceId: service.id,
          providerId: service.providerId,
          title: service.title,
          description: service.description,
          category: service.category,
          date: eventDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: service.location,
          isOnline: service.isOnline,
          price: service.price,
          duration: service.duration,
          maxParticipants: schedule.maxSlots || 1,
          currentParticipants: 0, // TODO: Calculate from reservations
          isServiceSlot: true,
          tags: ['service-slot', ...service.tags]
        });
      });
    });
    
    console.log('📅 Generated', events.length, 'calendar events for service:', service.title);
    return events;
  };

  const getAllServiceCalendarEvents = (userId: string): any[] => {
    const userServices = getUserServices(userId).filter((service: Service) => service.isScheduled);
    const allEvents: any[] = [];
    
    console.log('🔍 Services Store: Getting calendar events for userId:', userId);
    console.log('🔍 Services Store: User scheduled services:', userServices.length, userServices.map(s => ({ id: s.id, title: s.title, isScheduled: s.isScheduled })));
    
    userServices.forEach(service => {
      const serviceEvents = getServiceCalendarEvents(service.id);
      console.log('🔍 Services Store: Generated', serviceEvents.length, 'events for service:', service.title);
      allEvents.push(...serviceEvents);
    });
    
    console.log('📅 Generated total', allEvents.length, 'service calendar events for user:', userId);
    return allEvents;
  };

  return (
    <ServicesContext.Provider value={{
      services,
      reservations,
      addService,
      updateService,
      deleteService,
      getUserServices,
      getServicesByCategory,
      getServiceCalendarEvents,
      getAllServiceCalendarEvents,
      createReservation,
      updateReservationStatus,
      getServiceReservations,
      getUserReservations,
      isLoading,
    }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = (): ServicesContextType => {
  const context = useContext(ServicesContext);
  if (!context) {
    // Return safe fallback values instead of throwing error
    console.warn('useServices called outside ServicesProvider, returning defaults');
    return {
      services: [],
      reservations: [],
      addService: async () => { 
        console.warn('addService called without provider'); 
      },
      updateService: async () => { 
        console.warn('updateService called without provider'); 
      },
      deleteService: async () => { 
        console.warn('deleteService called without provider'); 
      },
      getUserServices: () => [],
      getServicesByCategory: () => [],
      getServiceCalendarEvents: () => [],
      getAllServiceCalendarEvents: () => [],
      createReservation: async () => { 
        console.warn('createReservation called without provider'); 
      },
      updateReservationStatus: async () => { 
        console.warn('updateReservationStatus called without provider'); 
      },
      getServiceReservations: () => [],
      getUserReservations: () => [],
      isLoading: false,
    };
  }
  return context;
};