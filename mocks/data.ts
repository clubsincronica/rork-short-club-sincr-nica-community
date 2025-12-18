import { User, Service, Lodging, ServiceCategory, LodgingType, CalendarEvent } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: '1',  // CORRECTED: Database has Tomas = ID 1
    name: 'Tomas De La Llosa',
    email: 'tom_weasley@hotmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Founder & CEO at TechWave Solutions. Passionate about AI and sustainable technology.',
    location: 'San Francisco, CA',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    specialties: ['Software Development', 'AI', 'Machine Learning'],
    isServiceProvider: false,
    rating: 4.8,
    reviewCount: 32,
    joinedDate: '2024-02-20',
    verified: true,
    instagram: 'tomasllosa',
    tiktok: '@tomasllosa',
  },
  {
    id: '2',  // CORRECTED: Database has Matias = ID 2
    name: 'Matias Cazeaux',
    email: 'matias.cazeaux@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Fundador de Sincrónica Community, apasionado por crear espacios de conexión consciente.',
    location: 'Mar del Plata, Argentina',
    coordinates: { latitude: -38.02, longitude: -57.53 },
    specialties: ['Community Building', 'Eventos Conscientes', 'Conexión Humana'],
    isServiceProvider: true,
    rating: 4.9,
    reviewCount: 45,
    joinedDate: '2024-01-15',
    verified: true,
    instagram: 'matiascazeaux',
    facebook: 'matias.cazeaux',
  },
  {
    id: '3',
    name: 'Luna Moonwhisper',
    email: 'luna@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
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

// Export users array (food users removed for post-beta)
export const allMockUsers = mockUsers;

// Mock Calendar Events for testing "ON Today" feature
// Using fixed times that will always be in the future for the current day
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

console.log('Mock Data: Creating events for today:', todayStr);
console.log('Mock Data: Current time:', today.toISOString());

// Use fixed afternoon/evening times that are likely to be in the future
// These will work for most testing scenarios
const futureTime1 = '14:00';
const futureTime2 = '15:30';
const futureTime3 = '17:00';
const futureTime4 = '19:00';
const futureTime5 = '20:30';

console.log('Mock Data: Using fixed future times:', { futureTime1, futureTime2, futureTime3, futureTime4, futureTime5 });

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event1',
    providerId: '1',
    provider: mockUsers[0],
    title: 'Círculo de Sanación Reiki Grupal',
    description: 'Únete a nuestro círculo de sanación mensual. Experimenta el poder del Reiki en comunidad.',
    category: 'healing',
    startTime: futureTime1,
    endTime: '15:30',
    date: todayStr,
    location: 'Centro Holístico Sincrónica',
    isOnline: false,
    maxParticipants: 20,
    currentParticipants: 3, // Low occupation - will be featured
    price: 45,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    tags: ['reiki', 'sanación-grupal', 'energía'],
    status: 'upcoming',
  },
  {
    id: 'event2',
    providerId: '2',
    provider: mockUsers[1],
    title: 'Taller de Respiración Consciente',
    description: 'Aprende técnicas de respiración para reducir el estrés y aumentar tu vitalidad.',
    category: 'coaching',
    startTime: futureTime2,
    endTime: '16:00',
    date: todayStr,
    location: 'Sala de Meditación Luna',
    isOnline: true,
    maxParticipants: 15,
    currentParticipants: 2, // Very low occupation - high priority
    price: 60,
    tags: ['respiración', 'mindfulness', 'bienestar'],
    status: 'upcoming',
  },
  {
    id: 'event3',
    providerId: '3',
    provider: mockUsers[2],
    title: 'Yoga al Atardecer con Cuencos Tibetanos',
    description: 'Fluye con el atardecer mientras los cuencos tibetanos armonizan tu energía.',
    category: 'yoga',
    startTime: futureTime3,
    endTime: '19:30',
    date: todayStr,
    location: 'Jardín de Paz',
    isOnline: false,
    maxParticipants: 25,
    currentParticipants: 8, // Medium-low occupation
    price: 35,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    tags: ['yoga', 'sonido', 'atardecer'],
    status: 'upcoming',
  },
  {
    id: 'event4',
    providerId: '1',
    provider: mockUsers[0],
    title: 'Meditación Guiada de Luna Nueva',
    description: 'Conecta con la energía de la luna nueva para manifestar tus intenciones.',
    category: 'meditation',
    startTime: futureTime4,
    endTime: '21:00',
    date: todayStr,
    location: 'Online - Zoom',
    isOnline: true,
    maxParticipants: 50,
    currentParticipants: 45, // High occupation - won't be featured prominently
    price: 25,
    tags: ['meditación', 'luna-nueva', 'manifestación'],
    status: 'upcoming',
  },
  {
    id: 'event5',
    providerId: '2',
    provider: mockUsers[1],
    title: 'Sesión de Coaching Grupal: Encuentra tu Propósito',
    description: 'Descubre tu propósito de vida en esta sesión transformadora.',
    category: 'coaching',
    startTime: futureTime1,
    endTime: '15:00',
    date: todayStr,
    location: 'Centro de Desarrollo Personal',
    isOnline: false,
    maxParticipants: 10,
    currentParticipants: 1, // Very low occupation - highest priority
    price: 75,
    tags: ['propósito', 'coaching-grupal', 'transformación'],
    status: 'upcoming',
  },
  {
    id: 'event6',
    providerId: '3',
    provider: mockUsers[2],
    title: 'Baño de Gong: Viaje Sonoro Profundo',
    description: 'Sumérgete en las vibraciones sanadoras del gong para una relajación profunda.',
    category: 'energy-work',
    startTime: futureTime5,
    endTime: '17:30',
    date: todayStr,
    location: 'Templo del Sonido',
    isOnline: false,
    maxParticipants: 12,
    currentParticipants: 4, // Low occupation
    price: 50,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    tags: ['gong', 'sanación-sonora', 'relajación'],
    status: 'upcoming',
  },
];
