import { User, Service, Lodging, ServiceCategory, LodgingType, FoodProvider, FoodCategory, CalendarEvent } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Luna Moonwhisper',
    email: 'luna@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Maestra de Reiki certificada y guía espiritual con más de 10 años de experiencia ayudando a las almas a encontrar su camino.',
    location: 'Sedona, AZ',
    coordinates: { latitude: 34.8697, longitude: -111.7610 },
    specialties: ['Sanación Reiki', 'Equilibrio de Chakras', 'Guía Espiritual'],
    isServiceProvider: true,
    rating: 4.9,
    reviewCount: 127,
    joinedDate: '2022-03-15',
    verified: true,
  },
  {
    id: '2',
    name: 'River Sage',
    email: 'river@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Coach de vida holístico especializado en mindfulness y vida consciente.',
    location: 'Tulum, Mexico',
    coordinates: { latitude: 20.2114, longitude: -87.4654 },
    specialties: ['Coaching de Vida', 'Meditación', 'Trabajo Respiratorio'],
    isServiceProvider: true,
    rating: 4.8,
    reviewCount: 89,
    joinedDate: '2021-11-20',
    verified: true,
  },
  {
    id: '3',
    name: 'Aurora Lightbringer',
    email: 'aurora@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Sanadora de sonido e instructora de yoga creando experiencias transformadoras.',
    location: 'Ubud, Bali',
    coordinates: { latitude: -8.5069, longitude: 115.2625 },
    specialties: ['Sanación con Sonido', 'Yoga', 'Terapia con Cristales'],
    isServiceProvider: true,
    rating: 4.9,
    reviewCount: 156,
    joinedDate: '2020-08-10',
    verified: true,
  },
];

export const mockServices: Service[] = [
  {
    id: '1',
    providerId: '1',
    provider: mockUsers[0],
    title: 'Sesión de Sanación Reiki',
    description: 'Experimenta sanación profunda y alineación energética a través de técnicas tradicionales de Reiki. Perfecto para alivio del estrés, equilibrio emocional y despertar espiritual.',
    category: 'healing' as ServiceCategory,
    price: 120,
    duration: 60,
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    ],
    location: 'Sedona, AZ',
    isOnline: true,
    rating: 4.9,
    reviewCount: 45,
    tags: ['reiki', 'sanación-energética', 'chakras', 'relajación'],
  },
  {
    id: '2',
    providerId: '2',
    provider: mockUsers[1],
    title: 'Coaching de Vida Consciente',
    description: 'Transforma tu vida a través de la conciencia plena y elecciones conscientes. Sesiones de coaching 1-a-1 para ayudarte a alinearte con tu ser superior.',
    category: 'coaching' as ServiceCategory,
    price: 150,
    duration: 90,
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    ],
    location: 'Tulum, Mexico',
    isOnline: true,
    rating: 4.8,
    reviewCount: 32,
    tags: ['coaching-de-vida', 'mindfulness', 'crecimiento-personal', 'conciencia'],
  },
  {
    id: '3',
    providerId: '3',
    provider: mockUsers[2],
    title: 'Meditación con Baño de Sonido',
    description: 'Sumérgete en frecuencias sanadoras con cuencos de cristal, gongs y campanillas. Una experiencia profundamente relajante para mente, cuerpo y alma.',
    category: 'meditation' as ServiceCategory,
    price: 80,
    duration: 75,
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    ],
    location: 'Ubud, Bali',
    isOnline: false,
    rating: 4.9,
    reviewCount: 67,
    tags: ['sanación-con-sonido', 'meditación', 'cuencos-de-cristal', 'relajación'],
  },
];

export const mockLodging: Lodging[] = [
  {
    id: '1',
    hostId: '1',
    host: mockUsers[0],
    title: 'Retiro Sagrado del Desierto',
    description: 'Un santuario pacífico ubicado entre las rocas rojas de Sedona. Perfecto para retiros de meditación, talleres de sanación y reuniones espirituales.',
    type: 'retreat-center' as LodgingType,
    pricePerNight: 180,
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    ],
    location: 'Sedona, AZ',
    amenities: ['Jardín de Meditación', 'Sala de Cristales', 'Cocina Orgánica', 'Estudio de Yoga', 'Espacio para Ceremonias de Fuego'],
    maxGuests: 8,
    rating: 4.9,
    reviewCount: 23,
    availableDates: ['2024-02-15', '2024-02-16', '2024-02-17'],
  },
  {
    id: '2',
    hostId: '3',
    host: mockUsers[2],
    title: 'Santuario de Sanación en la Selva',
    description: 'Lodge ecológico de bambú rodeado de selva tropical. Ideal para desintoxicación digital, retiros de yoga y conexión con la naturaleza.',
    type: 'eco-lodge' as LodgingType,
    pricePerNight: 120,
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    ],
    location: 'Ubud, Bali',
    amenities: ['Piscina Infinita', 'Shala de Yoga', 'Jardín Orgánico', 'Espacio de Sanación con Sonido', 'Vistas de la Selva'],
    maxGuests: 6,
    rating: 4.8,
    reviewCount: 41,
    availableDates: ['2024-02-20', '2024-02-21', '2024-02-22'],
  },
];

export const mockFoodUsers: User[] = [
  {
    id: '4',
    name: 'Sage Greenleaf',
    email: 'sage@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Chef orgánico especializado en cocina vegana nutritiva y medicina alimentaria.',
    location: 'Costa Rica',
    coordinates: { latitude: 9.7489, longitude: -83.7534 },
    specialties: ['Cocina Vegana', 'Medicina Alimentaria', 'Ingredientes Orgánicos'],
    isServiceProvider: true,
    rating: 4.8,
    reviewCount: 92,
    joinedDate: '2021-05-10',
    verified: true,
  },
  {
    id: '5',
    name: 'Ocean Bluewater',
    email: 'ocean@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Especialista en jugos prensados en frío y superalimentos marinos.',
    location: 'California',
    coordinates: { latitude: 36.7783, longitude: -119.4179 },
    specialties: ['Jugos Prensados', 'Superalimentos', 'Nutrición Holística'],
    isServiceProvider: true,
    rating: 4.9,
    reviewCount: 78,
    joinedDate: '2022-01-20',
    verified: true,
  },
];

// Export combined users array
export const allMockUsers = [...mockUsers, ...mockFoodUsers];

export const mockFoodProviders: FoodProvider[] = [
  {
    id: '1',
    providerId: '1',
    provider: mockUsers[0],
    businessName: 'Jardín Sagrado Orgánico',
    description: 'Comidas veganas orgánicas preparadas con amor e intención. Utilizamos ingredientes locales y de temporada para nutrir cuerpo, mente y alma.',
    category: 'organic' as FoodCategory,
    cuisine: ['Vegana', 'Mediterránea', 'Ayurvédica'],
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop',
    ],
    location: 'Sedona, AZ',
    deliveryRadius: 15,
    isDeliveryAvailable: true,
    isPickupAvailable: true,
    rating: 4.9,
    reviewCount: 87,
    tags: ['orgánico', 'vegano', 'local', 'sin-gluten', 'ayurvédico'],
    openingHours: {
      monday: '8:00 - 18:00',
      tuesday: '8:00 - 18:00',
      wednesday: '8:00 - 18:00',
      thursday: '8:00 - 18:00',
      friday: '8:00 - 20:00',
      saturday: '9:00 - 20:00',
      sunday: '9:00 - 17:00',
    },
    specialties: ['Bowls de Quinoa', 'Smoothies Verdes', 'Ensaladas Energéticas', 'Sopas Curativas'],
    certifications: ['Orgánico Certificado', '100% Vegano', 'Sin Gluten'],
  },
  {
    id: '2',
    providerId: '4',
    provider: mockFoodUsers[0],
    businessName: 'Elixir de Vida',
    description: 'Bar de jugos y superalimentos especializado en bebidas adaptógenas y comidas crudas que elevan tu vibración y energía vital.',
    category: 'juice-bar' as FoodCategory,
    cuisine: ['Cruda', 'Superalimentos', 'Adaptógenos'],
    images: [
      'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop',
    ],
    location: 'Costa Rica',
    deliveryRadius: 10,
    isDeliveryAvailable: true,
    isPickupAvailable: true,
    rating: 4.8,
    reviewCount: 124,
    tags: ['jugos-frescos', 'superalimentos', 'adaptógenos', 'crudo', 'detox'],
    openingHours: {
      monday: '7:00 - 19:00',
      tuesday: '7:00 - 19:00',
      wednesday: '7:00 - 19:00',
      thursday: '7:00 - 19:00',
      friday: '7:00 - 20:00',
      saturday: '8:00 - 20:00',
      sunday: '8:00 - 18:00',
    },
    specialties: ['Jugos Prensados en Frío', 'Leches de Nueces', 'Shots de Jengibre', 'Bowls de Açaí'],
    certifications: ['Ingredientes Orgánicos', 'Prensado en Frío', 'Sin Azúcar Añadido'],
  },
  {
    id: '3',
    providerId: '5',
    provider: mockFoodUsers[1],
    businessName: 'Cocina Consciente Bali',
    description: 'Restaurante macrobiótico que honra la filosofía del equilibrio yin-yang en cada plato. Comida como medicina para el alma.',
    category: 'macrobiotic' as FoodCategory,
    cuisine: ['Macrobiótica', 'Asiática', 'Medicina Tradicional'],
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
    ],
    location: 'California',
    deliveryRadius: 8,
    isDeliveryAvailable: false,
    isPickupAvailable: true,
    rating: 4.9,
    reviewCount: 156,
    tags: ['macrobiótico', 'equilibrio', 'medicina-alimentaria', 'granos-integrales'],
    openingHours: {
      monday: '11:00 - 21:00',
      tuesday: '11:00 - 21:00',
      wednesday: '11:00 - 21:00',
      thursday: '11:00 - 21:00',
      friday: '11:00 - 22:00',
      saturday: '11:00 - 22:00',
      sunday: 'Cerrado',
    },
    specialties: ['Miso Ramen', 'Tempeh Marinado', 'Arroz Integral con Verduras', 'Té de Hierbas Medicinales'],
    certifications: ['Ingredientes Locales', 'Sin Químicos', 'Preparación Tradicional'],
  },
];

// ─── Temporada Verano 26/27 · microCósmos (Mar del Plata) ────────────────────
// Eventos reales de la temporada. Las fechas se generan como próximas
// ocurrencias desde hoy (nunca en el pasado) para que el tablero "HOY EN VIVO"
// y el calendario tengan material real de demo en cualquier momento.

const DAY_MS = 24 * 60 * 60 * 1000;

const FRIDAY = 5;
const SUNDAY = 0;
const WEDNESDAY = 3;

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime() + days * DAY_MS);
  next.setHours(12, 0, 0, 0);
  return next;
}

/** Próxima fecha (a partir de mañana) que caiga en `weekday` (0=dom … 6=sáb). */
function nextWeekday(weekday: number): Date {
  let cursor = addDays(new Date(), 1);
  while (cursor.getDay() !== weekday) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

// La temporada arranca un viernes; los domingos y miércoles cuelgan de esa misma
// semana para que el orden del calendario tenga sentido (vie → dom → mié).
const seasonAnchor = nextWeekday(FRIDAY);
const fridays = Array.from({ length: 6 }, (_, i) => addDays(seasonAnchor, i * 7));
const sundays = fridays.map((friday) => addDays(friday, 2));
const wednesdays = fridays.slice(0, 5).map((friday) => addDays(friday, 5));

const SEASON_LOCATION = 'Casa Sincrónica · Mar del Plata';

interface SeasonEventInput {
  id: string;
  providerIndex: number;
  title: string;
  description: string;
  category: ServiceCategory;
  date: Date;
  startTime: string;
  endTime: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  image?: string;
  tags: string[];
}

function seasonEvent(input: SeasonEventInput): CalendarEvent {
  const provider = mockUsers[input.providerIndex] ?? mockUsers[0];
  return {
    id: input.id,
    providerId: provider.id,
    provider,
    title: input.title,
    description: input.description,
    category: input.category,
    startTime: input.startTime,
    endTime: input.endTime,
    date: isoDate(input.date),
    location: SEASON_LOCATION,
    isOnline: false,
    maxParticipants: input.maxParticipants,
    currentParticipants: input.currentParticipants,
    price: input.price,
    image: input.image,
    tags: input.tags,
    status: 'upcoming',
  };
}

export const mockCalendarEvents: CalendarEvent[] = [
  // Viernes 21 h · microCósmos (evento premium, 10 auriculares)
  ...fridays.map((date, index) =>
    seasonEvent({
      id: `microcosmos-${index + 1}`,
      providerIndex: 0,
      title: 'microCósmos · travesía sonora',
      description:
        'Navegación de la consciencia en 10 auriculares. Una luna del calendario, una travesía: te guiamos al oído por un paisaje sonoro en vivo, sin altavoces, sin pantallas.',
      category: 'meditation',
      date,
      startTime: '21:00',
      endTime: '22:30',
      price: 40000,
      maxParticipants: 10,
      currentParticipants: index === 0 ? 2 : index === 1 ? 4 : 1,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
      tags: ['microCósmos', 'silent', '10 auriculares', 'travesía'],
    })
  ),

  // Domingos 7:30 h · Meditación del amanecer (puerta de entrada)
  ...sundays.map((date, index) =>
    seasonEvent({
      id: `amanecer-${index + 1}`,
      providerIndex: 1,
      title: 'Meditación del amanecer',
      description:
        'Salimos al amanecer con auriculares y una guía suave. La forma más simple de entrar al microCósmos: respiración, silencio y el mar de fondo.',
      category: 'meditation',
      date,
      startTime: '07:30',
      endTime: '08:30',
      price: 12000,
      maxParticipants: 10,
      currentParticipants: index === 0 ? 3 : index === 1 ? 5 : 2,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      tags: ['amanecer', 'meditación', 'auriculares'],
    })
  ),

  // Miércoles 19 h · Yoga del Kin
  ...wednesdays.map((date, index) =>
    seasonEvent({
      id: `yoga-kin-${index + 1}`,
      providerIndex: 2,
      title: 'Yoga del Kin',
      description:
        'Práctica suave guiada por el kin del día: la energía del calendario maya aplicada al cuerpo. Ideal si venís del trabajo y querés aterrizar.',
      category: 'yoga',
      date,
      startTime: '19:00',
      endTime: '20:15',
      price: 20000,
      maxParticipants: 12,
      currentParticipants: index === 0 ? 4 : index === 1 ? 7 : 3,
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
      tags: ['yoga', 'kin', 'calendario maya'],
    })
  ),
];