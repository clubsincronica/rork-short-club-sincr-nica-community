import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoWorkSpace, SubSpace, SpaceBooking } from '@/types/user';

const STORAGE_KEY = 'cowork_store_v1';

interface CoWorkStore {
  spaces: CoWorkSpace[];
  bookings: SpaceBooking[];
  isLoading: boolean;
  error: string | null;

  // Space actions
  loadData: () => Promise<void>;
  addSpace: (space: Omit<CoWorkSpace, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>) => Promise<string>;
  updateSpace: (id: string, updates: Partial<CoWorkSpace>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  getSpaceById: (id: string) => CoWorkSpace | undefined;
  getSpacesByOwnerId: (ownerId: string) => CoWorkSpace[];
  publishSpace: (id: string, isPublished: boolean) => Promise<void>;

  // SubSpace actions
  addSubSpace: (spaceId: string, subSpace: Omit<SubSpace, 'id' | 'spaceId'>) => Promise<string>;
  updateSubSpace: (spaceId: string, subSpaceId: string, updates: Partial<SubSpace>) => Promise<void>;
  deleteSubSpace: (spaceId: string, subSpaceId: string) => Promise<void>;

  // Booking actions
  addBooking: (booking: Omit<SpaceBooking, 'id' | 'createdAt' | 'status' | 'paymentStatus'>) => Promise<string>;
  updateBookingStatus: (bookingId: string, status: SpaceBooking['status']) => Promise<void>;
  getBookingsForSubSpace: (subSpaceId: string) => SpaceBooking[];
  getBookingsForSpace: (spaceId: string) => SpaceBooking[];
  getBookingsForUser: (userId: string) => SpaceBooking[];
  isSlotAvailable: (subSpaceId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string) => boolean;
}

const save = async (spaces: CoWorkSpace[], bookings: SpaceBooking[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ spaces, bookings }));
};

export const useCoWork = create<CoWorkStore>((set, get) => ({
  spaces: [],
  bookings: [],
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ spaces: parsed.spaces || [], bookings: parsed.bookings || [], isLoading: false, error: null });
      } else {
        // Seed demo space for Ivana's Art Gallery
        const demoSpace: CoWorkSpace = {
          id: 'demo-space-001',
          ownerId: '1',
          title: 'Galería de Arte Ivana',
          description: 'Un espacio creativo y versátil en el corazón de la ciudad. Con múltiples ambientes únicos, ideal para streaming, clases, sesiones de DJ y estudios de arte.',
          location: 'Av. Corrientes 1234, Buenos Aires',
          images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&auto=format&fit=crop'],
          amenities: ['WiFi', 'Aire Acondicionado', 'Baño privado', 'Cocina compartida', 'Estacionamiento'],
          calendarMode: 'unified',
          isPublished: true,
          rating: 4.8,
          reviewCount: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['Arte', 'Galería', 'Estudio', 'Streaming'],
          subSpaces: [
            {
              id: 'sub-001',
              spaceId: 'demo-space-001',
              title: 'Espacio Underground A – Streaming',
              description: 'Espacio subterráneo con fondo artístico impresionante. Perfecto para streaming con muy poco tránsito y excelente estética de fondo.',
              type: 'streaming-set',
              capacity: 4,
              features: ['Fondo artístico', 'Baja circulación', 'Luz natural filtrada', 'WiFi de alta velocidad'],
              images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop'],
              pricePerHour: 2500,
              pricePerDay: 15000,
              billingUnits: ['hour', 'day'],
              isActive: true,
              floorLabel: 'Subsuelo',
              calendarMode: 'unified',
              color: '#9bdbbf',
            },
            {
              id: 'sub-002',
              spaceId: 'demo-space-001',
              title: 'Espacio Underground B – DJ School',
              description: 'Sala cerrada con excelente absorción de sonido. Equipada para clases de DJ y producción musical.',
              type: 'recording-booth',
              capacity: 6,
              features: ['Absorción de sonido', 'Insonorizado', 'Espejo', 'Sistema de audio'],
              images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop'],
              pricePerHour: 3500,
              pricePerDay: 20000,
              pricePerWeek: 90000,
              billingUnits: ['hour', 'day', 'week'],
              isActive: true,
              floorLabel: 'Subsuelo',
              calendarMode: 'separate',
              color: '#fbac94',
            },
            {
              id: 'sub-003',
              spaceId: 'demo-space-001',
              title: 'Planta Baja – Vidriera',
              description: 'Espacio abierto a la calle con grandes ventanales. Luz natural abundante, ideal para sesiones de streaming o fotografía.',
              type: 'streaming-set',
              capacity: 8,
              features: ['Grandes ventanales', 'Luz natural', 'Acceso a la calle', 'Visibilidad exterior'],
              images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop'],
              pricePerHour: 2000,
              pricePerDay: 12000,
              billingUnits: ['hour', 'day'],
              isActive: true,
              floorLabel: 'Planta Baja',
              calendarMode: 'unified',
              color: '#fbeb5c',
            },
            {
              id: 'sub-004',
              spaceId: 'demo-space-001',
              title: 'Mezzanine – Estudio 1',
              description: 'Estudio privado en el entrepiso con luz natural y ambiente tranquilo. Ideal para work sessions o sesiones de arte individuales.',
              type: 'studio',
              capacity: 2,
              features: ['Privacidad', 'Luz natural', 'Escritorio grande', 'Silencio'],
              images: ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop'],
              pricePerHour: 1800,
              pricePerDay: 10000,
              pricePerWeek: 45000,
              pricePerMonth: 150000,
              billingUnits: ['hour', 'day', 'week', 'month'],
              isActive: true,
              floorLabel: 'Mezzanine',
              calendarMode: 'separate',
              color: '#ac8cb3',
            },
            {
              id: 'sub-005',
              spaceId: 'demo-space-001',
              title: 'Mezzanine – Estudio 2',
              description: 'Segundo estudio privado en el entrepiso. Equipado para trabajo creativo, diseño o sesiones artísticas.',
              type: 'office',
              capacity: 3,
              features: ['Privacidad', 'Escritorio doble', 'Pizarrón', 'Vista al patio'],
              images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop'],
              pricePerHour: 1800,
              pricePerDay: 10000,
              pricePerWeek: 45000,
              pricePerMonth: 150000,
              billingUnits: ['hour', 'day', 'week', 'month'],
              isActive: true,
              floorLabel: 'Mezzanine',
              calendarMode: 'separate',
              color: '#6aaaca',
            },
          ],
        };
        await save([demoSpace], []);
        set({ spaces: [demoSpace], bookings: [], isLoading: false, error: null });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  addSpace: async (spaceData) => {
    const id = `space-${Date.now()}`;
    const newSpace: CoWorkSpace = {
      ...spaceData,
      id,
      rating: 0,
      reviewCount: 0,
      subSpaces: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const spaces = [...get().spaces, newSpace];
    await save(spaces, get().bookings);
    set({ spaces });
    return id;
  },

  updateSpace: async (id, updates) => {
    const spaces = get().spaces.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
  },

  deleteSpace: async (id) => {
    const spaces = get().spaces.filter(s => s.id !== id);
    const bookings = get().bookings.filter(b => b.spaceId !== id);
    await save(spaces, bookings);
    set({ spaces, bookings });
  },

  getSpaceById: (id) => get().spaces.find(s => s.id === id),

  getSpacesByOwnerId: (ownerId) => get().spaces.filter(s => s.ownerId === String(ownerId)),

  publishSpace: async (id, isPublished) => {
    const spaces = get().spaces.map(s =>
      s.id === id ? { ...s, isPublished, updatedAt: new Date().toISOString() } : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
  },

  addSubSpace: async (spaceId, subSpaceData) => {
    const id = `sub-${Date.now()}`;
    const newSub: SubSpace = { ...subSpaceData, id, spaceId };
    const spaces = get().spaces.map(s =>
      s.id === spaceId
        ? { ...s, subSpaces: [...s.subSpaces, newSub], updatedAt: new Date().toISOString() }
        : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
    return id;
  },

  updateSubSpace: async (spaceId, subSpaceId, updates) => {
    const spaces = get().spaces.map(s =>
      s.id === spaceId
        ? {
            ...s,
            subSpaces: s.subSpaces.map(sub => sub.id === subSpaceId ? { ...sub, ...updates } : sub),
            updatedAt: new Date().toISOString(),
          }
        : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
  },

  deleteSubSpace: async (spaceId, subSpaceId) => {
    const spaces = get().spaces.map(s =>
      s.id === spaceId
        ? { ...s, subSpaces: s.subSpaces.filter(sub => sub.id !== subSpaceId), updatedAt: new Date().toISOString() }
        : s
    );
    const bookings = get().bookings.filter(b => b.subSpaceId !== subSpaceId);
    await save(spaces, bookings);
    set({ spaces, bookings });
  },

  addBooking: async (bookingData) => {
    const id = `booking-${Date.now()}`;
    const newBooking: SpaceBooking = {
      ...bookingData,
      id,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    const bookings = [...get().bookings, newBooking];
    await save(get().spaces, bookings);
    set({ bookings });
    return id;
  },

  updateBookingStatus: async (bookingId, status) => {
    const bookings = get().bookings.map(b => b.id === bookingId ? { ...b, status } : b);
    await save(get().spaces, bookings);
    set({ bookings });
  },

  getBookingsForSubSpace: (subSpaceId) => get().bookings.filter(b => b.subSpaceId === subSpaceId),

  getBookingsForSpace: (spaceId) => get().bookings.filter(b => b.spaceId === spaceId),

  getBookingsForUser: (userId) => get().bookings.filter(b => b.userId === String(userId)),

  isSlotAvailable: (subSpaceId, date, startTime, endTime, excludeBookingId) => {
    const relevant = get().bookings.filter(b =>
      b.subSpaceId === subSpaceId &&
      b.date === date &&
      b.status !== 'cancelled' &&
      b.id !== excludeBookingId
    );
    const start = startTime;
    const end = endTime;
    return !relevant.some(b => {
      // Check time overlap
      return start < b.endTime && end > b.startTime;
    });
  },
}));
