import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, ApiError } from '@/utils/apiClient';
import {
  CoWorkSpace,
  SubSpace,
  SpaceBooking,
  BillingUnit,
  CalendarMode,
  SubSpaceType,
  CoWorkAvailability,
  BusinessHoursEntry,
  SlotCell,
} from '@/types/user';

const STORAGE_KEY = 'cowork_store_v1';

export interface SpaceFilters {
  type?: string;
  capacity?: number;
  maxHourlyPrice?: number;
}

export interface CreateBookingInput {
  subspaceId: string | number;
  date: string;
  startTime: string;
  endTime: string;
  billingUnit: BillingUnit;
  quantity: number;
  notes?: string;
  guestName?: string;
}

export interface CheckoutResult {
  bookingId: number;
  mode: string;
  totalPrice: number;
}

type BookingStatus = SpaceBooking['status'] | 'approved' | 'declined';

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
  fetchPublishedSpaces: (filters?: SpaceFilters) => Promise<CoWorkSpace[]>;
  fetchSpaceDetail: (id: string, range?: { from?: string; to?: string }) => Promise<CoWorkSpace | null>;
  fetchOwnerSpaces: () => Promise<CoWorkSpace[]>;

  // SubSpace actions
  addSubSpace: (spaceId: string, subSpace: Omit<SubSpace, 'id' | 'spaceId'>) => Promise<string>;
  updateSubSpace: (spaceId: string, subSpaceId: string, updates: Partial<SubSpace>) => Promise<void>;
  deleteSubSpace: (spaceId: string, subSpaceId: string) => Promise<void>;

  // Booking actions
  addBooking: (booking: Omit<SpaceBooking, 'id' | 'createdAt' | 'status' | 'paymentStatus'>) => Promise<string>;
  createBooking: (input: CreateBookingInput) => Promise<CheckoutResult>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  getBookingsForSubSpace: (subSpaceId: string) => SpaceBooking[];
  getBookingsForSpace: (spaceId: string) => SpaceBooking[];
  getBookingsForUser: (userId: string) => SpaceBooking[];
  fetchGuestBookings: () => Promise<SpaceBooking[]>;
  fetchOwnerBookings: () => Promise<SpaceBooking[]>;
  isSlotAvailable: (subSpaceId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string) => boolean;
}

interface CachePayload {
  spaces: CoWorkSpace[];
  bookings: SpaceBooking[];
}

const save = async (spaces: CoWorkSpace[], bookings: SpaceBooking[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ spaces, bookings } as CachePayload));
};

const readCache = async (): Promise<CachePayload> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { spaces: [], bookings: [] };
    const parsed = JSON.parse(raw);
    return {
      spaces: Array.isArray(parsed?.spaces) ? parsed.spaces : [],
      bookings: Array.isArray(parsed?.bookings) ? parsed.bookings : [],
    };
  } catch {
    return { spaces: [], bookings: [] };
  }
};

const nowIso = () => new Date().toISOString();

const pickDefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as any)[k] = v;
  }
  return out;
};

const isNetworkError = (e: any) => !(e instanceof ApiError);

// Backend rows come from Postgres with snake_case columns and numeric ids.
// Normalize everything to the frontend camelCase shape with string ids.
const toStr = (v: unknown) => (v == null ? '' : String(v));

const spaceFromRow = (row: any): CoWorkSpace => ({
  id: toStr(row.id),
  ownerId: toStr(row.owner_id ?? row.ownerId),
  title: row.title ?? '',
  description: row.description ?? '',
  location: row.location ?? '',
  images: row.images ?? [],
  amenities: row.amenities ?? [],
  subSpaces: Array.isArray(row.subspaces) ? row.subspaces.map(subSpaceFromRow) : [],
  calendarMode: (row.calendar_mode ?? row.calendarMode ?? 'unified') as CalendarMode,
  isPublished: !!row.is_published,
  rating: Number(row.rating ?? 0),
  reviewCount: Number(row.review_count ?? 0),
  createdAt: row.created_at ?? nowIso(),
  updatedAt: row.updated_at ?? nowIso(),
  tags: row.tags ?? [],
});

const subSpaceFromRow = (row: any): SubSpace => ({
  id: toStr(row.id),
  spaceId: toStr(row.space_id ?? row.spaceId),
  title: row.title ?? '',
  description: row.description ?? '',
  type: (row.type ?? 'other') as SubSpaceType,
  capacity: Number(row.capacity ?? 1),
  features: row.features ?? [],
  images: row.images ?? [],
  pricePerHour: row.price_hour ?? undefined,
  pricePerDay: row.price_day ?? undefined,
  pricePerWeek: row.price_week ?? undefined,
  pricePerMonth: row.price_month ?? undefined,
  billingUnits: row.billing_units ?? ['hour'],
  isActive: !!row.is_active,
  floorLabel: row.floor_label ?? undefined,
  calendarMode: (row.calendar_mode ?? 'unified') as CalendarMode,
  color: row.color ?? undefined,
  instantBook: !!row.instant_book,
  cancellationPolicy: row.cancellation_policy ?? row.cancellationPolicy ?? undefined,
  businessHours: row.business_hours ?? undefined,
  slotGranularity: Number(row.slot_granularity ?? 30),
  minAdvance: Number(row.min_advance ?? 120),
  maxDuration: Number(row.max_duration ?? 8),
  availability: Array.isArray(row.availability)
    ? (row.availability as CoWorkAvailability)
    : undefined,
});

const bookingFromRow = (row: any): SpaceBooking => ({
  id: toStr(row.id),
  subSpaceId: toStr(row.subspace_id ?? row.subSpaceId),
  spaceId: toStr(row.space_id ?? row.spaceId),
  userId: toStr(row.user_id ?? row.userId),
  date: row.date ?? '',
  startTime: row.start_time ?? row.startTime ?? '',
  endTime: row.end_time ?? row.endTime ?? '',
  billingUnit: (row.billing_unit ?? row.billingUnit ?? 'hour') as BillingUnit,
  quantity: Number(row.quantity ?? 1),
  totalPrice: Number(row.total_price ?? row.totalPrice ?? 0),
  status: (row.status ?? 'pending') as SpaceBooking['status'],
  paymentStatus: (row.payment_status ?? 'pending') as SpaceBooking['paymentStatus'],
  notes: row.notes ?? undefined,
  createdAt: row.created_at ?? nowIso(),
  mode: (row.mode ?? 'request') as 'instant' | 'request',
  paymentProvider: row.payment_provider ?? row.paymentProvider ?? undefined,
  paymentId: row.payment_id ?? row.paymentId ?? undefined,
  guestName: row.guest_name ?? row.guestName ?? undefined,
});

// Backend stores business_hours as [{day,start,end}], while the frontend may
// carry either that array or a Record<day,{start,end}> — always send the array.
const normalizeBusinessHours = (
  bh: Record<string, { start: string; end: string }> | BusinessHoursEntry[] | undefined
): BusinessHoursEntry[] | undefined => {
  if (bh == null) return undefined;
  if (Array.isArray(bh)) return bh;
  if (typeof bh === 'object') {
    return Object.entries(bh).map(([day, v]) => ({ day, start: v.start, end: v.end }));
  }
  return undefined;
};

// Map a cached published space onto a fresh flat API row without losing
// locally-known subspaces (which /api/spaces does not return).
const mergeCachedInto = (mapped: CoWorkSpace[], cachedSpaces: CoWorkSpace[]): CoWorkSpace[] => {
  const byId = new Map<string, CoWorkSpace>();
  for (const s of cachedSpaces) byId.set(s.id, s);
  for (const m of mapped) {
    const prev = byId.get(m.id);
    byId.set(m.id, { ...m, subSpaces: prev && prev.subSpaces.length ? prev.subSpaces : m.subSpaces });
  }
  return [...byId.values()];
};

const buildDemoSpace = (): CoWorkSpace => ({
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
  createdAt: nowIso(),
  updatedAt: nowIso(),
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
});

export const useCoWork = create<CoWorkStore>((set, get) => ({
  spaces: [],
  bookings: [],
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true });
    const cached = await readCache();

    // Serve cached state immediately so existing owner/guest getters keep working.
    let spaces = cached.spaces;
    set({ spaces, bookings: cached.bookings });

    try {
      const rows: any[] = await apiFetch('/api/spaces');
      if (Array.isArray(rows) && rows.length > 0) {
        const mapped = rows.map(spaceFromRow);
        spaces = mergeCachedInto(mapped, cached.spaces);
      } else if (__DEV__ && cached.spaces.length === 0) {
        // Server reachable but no published spaces and nothing cached: demo seed (local only).
        spaces = [buildDemoSpace()];
      }
      set({ spaces, error: null, isLoading: false });
      await save(spaces, cached.bookings);
    } catch (e: any) {
      // Network/server error. Keep cached data; seed a local demo only when offline AND empty.
      if (__DEV__ && cached.spaces.length === 0) {
        spaces = [buildDemoSpace()];
        set({ spaces, error: null, isLoading: false });
        await save(spaces, cached.bookings);
      } else {
        set({ error: e?.message ?? String(e), isLoading: false });
      }
    }

    // When a user is logged in, also pull their own spaces (incl. unpublished) so
    // mis-espacios finds them on a fresh device. Non-fatal on failure (offline/unauth).
    try {
      const stored = await AsyncStorage.getItem('currentUser');
      if (stored) {
        const owner = JSON.parse(stored);
        if (owner && owner.id != null) {
          await get().fetchOwnerSpaces();
        }
      }
    } catch {
      // ignore
    }
  },

  fetchPublishedSpaces: async (filters) => {
    const qs: string[] = [];
    if (filters?.type) qs.push(`type=${encodeURIComponent(filters.type)}`);
    if (filters?.capacity != null) qs.push(`capacity=${filters.capacity}`);
    if (filters?.maxHourlyPrice != null) qs.push(`maxHourlyPrice=${filters.maxHourlyPrice}`);
    const query = qs.length ? `?${qs.join('&')}` : '';
    const rows: any[] = await apiFetch(`/api/spaces${query}`);
    const mapped = rows.map(spaceFromRow);
    const merged = mergeCachedInto(mapped, get().spaces);
    set({ spaces: merged, error: null });
    await save(merged, get().bookings);
    return mapped;
  },

  fetchSpaceDetail: async (id, range) => {
    try {
      // The backend only computes subspace availability when a date range is
      // provided (GET /api/spaces/:id?from=YYYY-MM-DD&to=YYYY-MM-DD).
      let path = `/api/spaces/${id}`;
      if (range?.from && range?.to) {
        path += `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
      }
      const row: any = await apiFetch(path);
      const detail = spaceFromRow(row);
      const others = get().spaces.filter(s => s.id !== detail.id);
      const spaces = [...others, detail];
      set({ spaces, error: null });
      await save(spaces, get().bookings);
      return detail;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  fetchOwnerSpaces: async () => {
    const rows: any[] = await apiFetch('/api/spaces/owner');
    const mapped = rows.map(spaceFromRow);
    // Merge over current state so richer cached/detail copies of subspaces are kept.
    const merged = mergeCachedInto(mapped, get().spaces);
    set({ spaces: merged, error: null });
    await save(merged, get().bookings);
    return mapped;
  },

  addSpace: async (spaceData) => {
    try {
      const res: { id: number; message?: string } = await apiFetch('/api/spaces', {
        method: 'POST',
        body: {
          title: spaceData.title,
          description: spaceData.description,
          location: spaceData.location,
          images: spaceData.images ?? [],
          amenities: spaceData.amenities ?? [],
          calendarMode: spaceData.calendarMode,
          tags: spaceData.tags ?? [],
        },
      });
      const id = toStr(res.id);
      const newSpace: CoWorkSpace = {
        ...spaceData,
        id,
        rating: 0,
        reviewCount: 0,
        subSpaces: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const spaces = [...get().spaces, newSpace];
      await save(spaces, get().bookings);
      set({ spaces });
      return id;
    } catch (e) {
      if (__DEV__ && isNetworkError(e)) {
        // Offline demo: keep a local-only copy mirroring the previous behavior.
        const id = `space-${Date.now()}`;
        const newSpace: CoWorkSpace = {
          ...spaceData,
          id,
          rating: 0,
          reviewCount: 0,
          subSpaces: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        const spaces = [...get().spaces, newSpace];
        await save(spaces, get().bookings);
        set({ spaces });
        return id;
      }
      throw e;
    }
  },

  updateSpace: async (id, updates) => {
    try {
      const body = pickDefined({
        title: updates.title,
        description: updates.description,
        location: updates.location,
        images: updates.images,
        amenities: updates.amenities,
        calendarMode: updates.calendarMode,
        isPublished: updates.isPublished,
        tags: updates.tags,
      });
      if (Object.keys(body).length) {
        await apiFetch(`/api/spaces/${id}`, { method: 'PUT', body });
      }
    } catch (e) {
      if (!(__DEV__ && (isNetworkError(e) || (e instanceof ApiError && e.status === 404)))) throw e;
    }
    const spaces = get().spaces.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: nowIso() } : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
  },

  deleteSpace: async (id) => {
    try {
      await apiFetch(`/api/spaces/${id}`, { method: 'DELETE' });
    } catch (e) {
      if (!(__DEV__ && (isNetworkError(e) || (e instanceof ApiError && e.status === 404)))) throw e;
    }
    const spaces = get().spaces.filter(s => s.id !== id);
    const bookings = get().bookings.filter(b => b.spaceId !== id);
    await save(spaces, bookings);
    set({ spaces, bookings });
  },

  getSpaceById: (id) => get().spaces.find(s => s.id === id),

  getSpacesByOwnerId: (ownerId) => get().spaces.filter(s => s.ownerId === String(ownerId)),

  publishSpace: async (id, isPublished) => {
    try {
      await apiFetch(`/api/spaces/${id}`, { method: 'PUT', body: { isPublished } });
    } catch (e) {
      if (!(__DEV__ && (isNetworkError(e) || (e instanceof ApiError && e.status === 404)))) throw e;
    }
    const spaces = get().spaces.map(s =>
      s.id === id ? { ...s, isPublished, updatedAt: nowIso() } : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
  },

  addSubSpace: async (spaceId, subSpaceData) => {
    const payload = {
      title: subSpaceData.title,
      description: subSpaceData.description,
      type: subSpaceData.type,
      capacity: subSpaceData.capacity,
      features: subSpaceData.features ?? [],
      images: subSpaceData.images ?? [],
      priceHour: subSpaceData.pricePerHour,
      priceDay: subSpaceData.pricePerDay,
      priceWeek: subSpaceData.pricePerWeek,
      priceMonth: subSpaceData.pricePerMonth,
      billingUnits: subSpaceData.billingUnits,
      isActive: subSpaceData.isActive,
      floorLabel: subSpaceData.floorLabel,
      calendarMode: subSpaceData.calendarMode,
      color: subSpaceData.color,
      instantBook: subSpaceData.instantBook,
      businessHours: normalizeBusinessHours(subSpaceData.businessHours),
      slotGranularity: subSpaceData.slotGranularity,
      minAdvance: subSpaceData.minAdvance,
      maxDuration: subSpaceData.maxDuration,
    };
    try {
      const res: { id: number; message?: string } = await apiFetch(`/api/spaces/${spaceId}/subspaces`, {
        method: 'POST',
        body: payload,
      });
      const id = toStr(res.id);
      const newSub: SubSpace = { ...subSpaceData, id, spaceId };
      const spaces = get().spaces.map(s =>
        s.id === spaceId
          ? { ...s, subSpaces: [...s.subSpaces, newSub], updatedAt: nowIso() }
          : s
      );
      await save(spaces, get().bookings);
      set({ spaces });
      return id;
    } catch (e) {
      if (__DEV__ && isNetworkError(e)) {
        const id = `sub-${Date.now()}`;
        const newSub: SubSpace = { ...subSpaceData, id, spaceId };
        const spaces = get().spaces.map(s =>
          s.id === spaceId
            ? { ...s, subSpaces: [...s.subSpaces, newSub], updatedAt: nowIso() }
            : s
        );
        await save(spaces, get().bookings);
        set({ spaces });
        return id;
      }
      throw e;
    }
  },

  updateSubSpace: async (spaceId, subSpaceId, updates) => {
    const body = pickDefined({
      title: updates.title,
      description: updates.description,
      type: updates.type,
      capacity: updates.capacity,
      features: updates.features,
      images: updates.images,
      priceHour: updates.pricePerHour,
      priceDay: updates.pricePerDay,
      priceWeek: updates.pricePerWeek,
      priceMonth: updates.pricePerMonth,
      billingUnits: updates.billingUnits,
      isActive: updates.isActive,
      floorLabel: updates.floorLabel,
      calendarMode: updates.calendarMode,
      color: updates.color,
      instantBook: updates.instantBook,
      businessHours: normalizeBusinessHours(updates.businessHours),
      slotGranularity: updates.slotGranularity,
      minAdvance: updates.minAdvance,
      maxDuration: updates.maxDuration,
    });
    try {
      await apiFetch(`/api/spaces/${spaceId}/subspaces/${subSpaceId}`, { method: 'PUT', body });
    } catch (e) {
      if (!(__DEV__ && (isNetworkError(e) || (e instanceof ApiError && e.status === 404)))) throw e;
    }
    const spaces = get().spaces.map(s =>
      s.id === spaceId
        ? {
            ...s,
            subSpaces: s.subSpaces.map(sub => sub.id === subSpaceId ? { ...sub, ...updates } : sub),
            updatedAt: nowIso(),
          }
        : s
    );
    await save(spaces, get().bookings);
    set({ spaces });
  },

  deleteSubSpace: async (spaceId, subSpaceId) => {
    try {
      await apiFetch(`/api/spaces/${spaceId}/subspaces/${subSpaceId}`, { method: 'DELETE' });
    } catch (e) {
      if (!(__DEV__ && (isNetworkError(e) || (e instanceof ApiError && e.status === 404)))) throw e;
    }
    const spaces = get().spaces.map(s =>
      s.id === spaceId
        ? { ...s, subSpaces: s.subSpaces.filter(sub => sub.id !== subSpaceId), updatedAt: nowIso() }
        : s
    );
    const bookings = get().bookings.filter(b => b.subSpaceId !== subSpaceId);
    await save(spaces, bookings);
    set({ spaces, bookings });
  },

  // Legacy local-only helper; cowork-detail.tsx still uses it until Task 10.
  addBooking: async (bookingData) => {
    const id = `booking-${Date.now()}`;
    const newBooking: SpaceBooking = {
      ...bookingData,
      id,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: nowIso(),
    };
    const bookings = [...get().bookings, newBooking];
    await save(get().spaces, bookings);
    set({ bookings });
    return id;
  },

  createBooking: async (input) => {
    const res: Omit<CheckoutResult, 'bookingId'> & { bookingId: number } = await apiFetch('/api/spaces/checkout', {
      method: 'POST',
      body: input,
    });
    return { bookingId: res.bookingId, mode: res.mode, totalPrice: res.totalPrice };
  },

  updateBookingStatus: async (bookingId, status) => {
    const apiStatus = status === 'confirmed' ? 'approved' : status;
    try {
      await apiFetch(`/api/spaces/bookings/${bookingId}/status`, { method: 'PUT', body: { status: apiStatus } });
    } catch (e) {
      if (!(__DEV__ && (isNetworkError(e) || (e instanceof ApiError && e.status === 404)))) throw e;
    }
    const mapped: SpaceBooking['status'] =
      apiStatus === 'approved' ? 'confirmed' : apiStatus === 'declined' ? 'cancelled' : (apiStatus as SpaceBooking['status']);
    const bookings = get().bookings.map(b => b.id === bookingId ? { ...b, status: mapped } : b);
    await save(get().spaces, bookings);
    set({ bookings });
  },

  fetchGuestBookings: async () => {
    const rows: any[] = await apiFetch('/api/spaces/bookings/guest');
    const mapped = rows.map(bookingFromRow);
    await save(get().spaces, mapped);
    set({ bookings: mapped });
    return mapped;
  },

  fetchOwnerBookings: async () => {
    const rows: any[] = await apiFetch('/api/spaces/bookings/owner');
    const mapped = rows.map(bookingFromRow);
    await save(get().spaces, mapped);
    set({ bookings: mapped });
    return mapped;
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
    return !relevant.some(b => startTime < b.endTime && endTime > b.startTime);
  },
}));

export type { SlotCell, CoWorkAvailability, BusinessHoursEntry };