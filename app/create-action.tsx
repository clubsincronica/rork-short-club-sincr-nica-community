import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Globe,
  Tag,
  ArrowLeft,
  Check,
  Plus,
  ImageIcon,
  Type,
  FileText,
  Package,
  Briefcase,
  ChevronRight,
} from '@/components/SmartIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCalendar } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';
import { useServices } from '@/hooks/services-store';
import { useProducts } from '@/hooks/products-store';
import { useLodging } from '@/hooks/lodging-store';
import { Colors, Gradients } from '@/constants/colors';

type ActionType = 'event' | 'service' | 'product' | 'lodging';

interface ActionData {
  type: ActionType;
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  isActive: boolean;
  availableSpots: string;
  permissions: string[];
  // Event-specific
  isRecurring: boolean;
  recurringStartDate: string;
  recurringEndDate: string;
  eventDate: string;
  eventTime: string;
  eventEndTime: string;

  // Service-specific
  duration: string;

  // Service calendar integration
  hasSchedule: boolean;
  startDate: string;      // Service availability start date
  endDate: string;        // Service availability end date
  selectedDays: string[]; // Days of week: ['monday', 'wednesday', 'friday']
  timeSlots: string[];    // Time slots: ['10:00-12:00', '14:00-16:00']

  // Lodging-specific
  lodgingType: string;    // 'retreat-center', 'healing-space', 'eco-lodge', 'spiritual-sanctuary', 'wellness-resort'
  maxGuests: string;
  amenities: string[];
  images: string[];

  // Common
  category: string;
  location: string;
  isOnline: boolean;
  maxParticipants: string;
}

const CATEGORIES = {
  event: [
    { id: 'talleres', label: 'Talleres', icon: '🎨' },
    { id: 'ceremonias', label: 'Ceremonias', icon: '🕯️' },
    { id: 'retiros', label: 'Retiros', icon: '🏔️' },
    { id: 'clases-grupales', label: 'Clases Grupales', icon: '👥' },
    { id: 'conferencias', label: 'Conferencias', icon: '🎤' },
  ],
  service: [
    { id: 'yoga', label: 'Yoga', icon: '🧘‍♀️' },
    { id: 'meditacion', label: 'Meditación', icon: '🧘' },
    { id: 'sanacion', label: 'Sanación', icon: '✨' },
    { id: 'coaching', label: 'Coaching', icon: '💪' },
    { id: 'terapia', label: 'Terapia', icon: '🌱' },
    { id: 'nutricion', label: 'Nutrición', icon: '🥗' },
  ],
  product: [
    { id: 'cristales', label: 'Cristales', icon: '💎' },
    { id: 'aceites', label: 'Aceites', icon: '🫙' },
    { id: 'libros', label: 'Libros', icon: '📚' },
    { id: 'artesanias', label: 'Artesanías', icon: '🎨' },
    { id: 'suplementos', label: 'Suplementos', icon: '💊' },
  ],
  lodging: [
    { id: 'retreat-center', label: 'Centro de Retiros', icon: '🏔️' },
    { id: 'healing-space', label: 'Espacio de Sanación', icon: '✨' },
    { id: 'eco-lodge', label: 'Eco-Lodge', icon: '🌿' },
    { id: 'spiritual-sanctuary', label: 'Santuario Espiritual', icon: '🕉️' },
    { id: 'wellness-resort', label: 'Resort de Bienestar', icon: '🧘' },
  ],
};

export default function CreateActionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { currentUser } = useUser();
  const { addEvent, updateEvent, events } = useCalendar();
  const { addService, updateService, services } = useServices();
  const { addProduct, updateProduct, products } = useProducts();
  const { addLodging, updateLodging, lodgings } = useLodging();

  // Edit mode detection
  const isEditMode = params.itemId ? true : false;
  const editItemId = params.itemId as string;
  const editItemType = params.itemType as string;

  console.log('CreateAction: Edit mode:', isEditMode, 'ItemID:', editItemId, 'Type:', editItemType);

  const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1); // Start at step 2 if editing
  const totalSteps = 4;
  const [isTimeSlotModalVisible, setIsTimeSlotModalVisible] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('');

  const [actionData, setActionData] = useState<ActionData>({
    type: (isEditMode && editItemType) ? editItemType as ActionType : 'event',
    title: '',
    description: '',
    price: '',
    isFree: false,
    isActive: true,
    availableSpots: '10',
    permissions: [],
    // Event-specific
    isRecurring: false,
    recurringStartDate: '',
    recurringEndDate: '',
    eventDate: '',
    eventTime: '',
    eventEndTime: '',
    // Service-specific
    duration: '60',
    // Service calendar integration
    hasSchedule: false,
    startDate: '',
    endDate: '',
    selectedDays: [],
    timeSlots: [],
    // Lodging-specific
    lodgingType: '',
    maxGuests: '4',
    amenities: [],
    images: [],
    // Common
    category: '',
    location: '',
    isOnline: false,
    maxParticipants: '10',
  });

  const updateData = (field: keyof ActionData, value: any) => {
    setActionData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get type label in Spanish
  const getTypeLabel = (type: ActionType): string => {
    switch (type) {
      case 'event': return 'evento';
      case 'service': return 'servicio';
      case 'product': return 'producto';
      case 'lodging': return 'alojamiento';
      default: return type;
    }
  };

  const getTypeLabelCapitalized = (type: ActionType): string => {
    switch (type) {
      case 'event': return 'Evento';
      case 'service': return 'Servicio';
      case 'product': return 'Producto';
      case 'lodging': return 'Alojamiento';
      default: return type;
    }
  };

  // Helper function to convert date to DD/MM/AAAA format for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';

    // If already in DD/MM/YYYY or DD/MM/AAAA format, return as is
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr;
    }

    // If in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    // Return as is if format unknown
    return dateStr;
  };

  // Load existing data when in edit mode
  useEffect(() => {
    if (isEditMode && editItemId && editItemType) {
      console.log('CreateAction: Loading data for edit mode');

      // Strip the type prefix from the ID if present (e.g., "event-123" -> "123")
      let cleanId = editItemId.replace(/^(event-|service-|product-)/, '');

      // Strip the timestamp suffix from expanded recurring event IDs (e.g., "123-1735689600000" -> "123")
      if (cleanId.includes('-')) {
        const parts = cleanId.split('-');
        // Check if the last part is a timestamp (long number)
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 10 && !isNaN(Number(lastPart))) {
          cleanId = parts.slice(0, -1).join('-');
          console.log('CreateAction: Detected expanded recurring event instance, using base ID:', cleanId);
        }
      }

      console.log('CreateAction: Clean ID:', cleanId, 'Original ID:', editItemId);

      let existingItem: any = null;

      // Find the item based on type
      if (editItemType === 'event') {
        existingItem = events.find((e: any) => e.id === cleanId || e.id === editItemId);
      } else if (editItemType === 'service') {
        existingItem = services.find((s: any) => s.id === cleanId || s.id === editItemId);
      } else if (editItemType === 'product') {
        existingItem = products.find((p: any) => p.id === cleanId || p.id === editItemId);
      }

      if (existingItem) {
        console.log('CreateAction: Found existing item:', existingItem);
        console.log('CreateAction: Existing permissions:', existingItem.permissions);

        // Map existing data to ActionData structure
        setActionData({
          type: editItemType as ActionType,
          title: existingItem.title || '',
          description: existingItem.description || '',
          price: existingItem.price?.toString() || '',
          isFree: existingItem.isFree || false,
          isActive: existingItem.isActive !== undefined ? existingItem.isActive : true,
          availableSpots: existingItem.availableSpots?.toString() || '10',
          permissions: existingItem.permissions || [],
          // Event-specific - handle different field naming conventions
          isRecurring: existingItem.isRecurring || (existingItem.recurring !== undefined) || false,
          recurringStartDate: formatDateForDisplay(existingItem.recurringStartDate || existingItem.recurring?.startDate || ''),
          recurringEndDate: formatDateForDisplay(existingItem.recurringEndDate || existingItem.recurring?.endDate || ''),
          eventDate: formatDateForDisplay(existingItem.date || existingItem.eventDate || ''),
          eventTime: existingItem.startTime || existingItem.time || existingItem.eventTime || '',
          eventEndTime: existingItem.endTime || '',
          // Service-specific
          duration: existingItem.duration?.toString() || '60',
          // Service calendar integration
          hasSchedule: existingItem.isScheduled || existingItem.hasSchedule || false,
          startDate: formatDateForDisplay(existingItem.startDate || ''),
          endDate: formatDateForDisplay(existingItem.endDate || ''),
          selectedDays: existingItem.schedule?.daysOfWeek || existingItem.selectedDays || [],
          timeSlots: existingItem.schedule?.timeSlots || existingItem.timeSlots || [],
          // Lodging-specific
          lodgingType: existingItem.type || '',
          maxGuests: existingItem.maxGuests?.toString() || '4',
          amenities: existingItem.amenities || [],
          images: existingItem.images || [],
          // Common
          category: existingItem.category || '',
          location: existingItem.location || '',
          isOnline: existingItem.isOnline || false,
          maxParticipants: existingItem.maxParticipants?.toString() || '10',
        });

        console.log('CreateAction: Data loaded successfully, permissions:', existingItem.permissions);
      } else {
        console.warn('CreateAction: Item not found in store');
      }
    }
  }, [isEditMode, editItemId, editItemType, events, services, products]);

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Type selection
        return actionData.type === 'event' || actionData.type === 'service' || actionData.type === 'product' || actionData.type === 'lodging';
      case 2: // Basic info
        if (!actionData.title.trim()) {
          Alert.alert('Error', 'El título es requerido');
          return false;
        }
        return true;
      case 3: // Specific details
        if (actionData.type === 'event') {
          if (actionData.isRecurring) {
            // Validation for recurring events
            if (!actionData.recurringStartDate) {
              Alert.alert('Error', 'La fecha de inicio es requerida (formato: DD/MM/AAAA)');
              return false;
            }
            if (!actionData.recurringEndDate) {
              Alert.alert('Error', 'La fecha de fin es requerida (formato: DD/MM/AAAA)');
              return false;
            }
            if (actionData.selectedDays.length === 0) {
              Alert.alert('Error', 'Debe seleccionar al menos un día de la semana');
              return false;
            }
            if (!actionData.eventTime) {
              Alert.alert('Error', 'La hora de inicio es requerida (formato: HH:MM)');
              return false;
            }
            if (!actionData.eventEndTime) {
              Alert.alert('Error', 'La hora de fin es requerida (formato: HH:MM)');
              return false;
            }
          } else {
            // Validation for one-time events
            if (!actionData.eventDate) {
              Alert.alert('Error', 'La fecha del evento es requerida (formato: DD/MM/AAAA)');
              return false;
            }
            if (!actionData.eventTime) {
              Alert.alert('Error', 'La hora del evento es requerida (formato: HH:MM)');
              return false;
            }
          }
        }

        if (actionData.type === 'service' && actionData.hasSchedule) {
          if (!actionData.startDate) {
            Alert.alert('Error', 'La fecha de inicio del servicio es requerida');
            return false;
          }
          if (!actionData.endDate) {
            Alert.alert('Error', 'La fecha de fin del servicio es requerida');
            return false;
          }
          if (actionData.selectedDays.length === 0) {
            Alert.alert('Error', 'Debe seleccionar al menos un día disponible');
            return false;
          }
          if (actionData.timeSlots.length === 0) {
            Alert.alert('Error', 'Debe agregar al menos un horario disponible');
            return false;
          }
        }

        if (actionData.type === 'lodging') {
          if (!actionData.lodgingType) {
            Alert.alert('Error', 'El tipo de alojamiento es requerido');
            return false;
          }
          if (!actionData.maxGuests || parseInt(actionData.maxGuests) < 1) {
            Alert.alert('Error', 'El número de huéspedes debe ser al menos 1');
            return false;
          }
        }

        if (!actionData.category) {
          Alert.alert('Error', 'La categoría es requerida');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }

      console.log('🚀 Create Action: Submitting:', actionData);

      if (actionData.type === 'event') {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        const timeRegex = /^\d{2}:\d{2}$/;

        if (actionData.isRecurring) {
          // Validate recurring event dates
          if (!dateRegex.test(actionData.recurringStartDate)) {
            Alert.alert('Error', 'Formato de fecha de inicio incorrecto. Use DD/MM/AAAA');
            return;
          }
          if (!dateRegex.test(actionData.recurringEndDate)) {
            Alert.alert('Error', 'Formato de fecha de fin incorrecto. Use DD/MM/AAAA');
            return;
          }
          if (!timeRegex.test(actionData.eventTime)) {
            Alert.alert('Error', 'Formato de hora de inicio incorrecto. Use HH:MM');
            return;
          }
          if (!timeRegex.test(actionData.eventEndTime)) {
            Alert.alert('Error', 'Formato de hora de fin incorrecto. Use HH:MM');
            return;
          }
        } else {
          // Validate one-time event date and time
          if (!dateRegex.test(actionData.eventDate)) {
            Alert.alert('Error', 'Formato de fecha incorrecto. Use DD/MM/AAAA');
            return;
          }
          if (!timeRegex.test(actionData.eventTime)) {
            Alert.alert('Error', 'Formato de hora incorrecto. Use HH:MM');
            return;
          }
        }

        // Convert date format DD/MM/YYYY -> YYYY-MM-DD
        const normalizedDate = actionData.isRecurring
          ? (() => {
            const [day, month, year] = actionData.recurringStartDate.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          })()
          : (() => {
            const [day, month, year] = actionData.eventDate.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          })();

        // Map category
        const categoryMap: { [key: string]: string } = {
          'talleres': 'yoga',
          'ceremonias': 'spiritual-guidance',
          'retiros': 'meditation',
          'clases-grupales': 'yoga',
          'conferencias': 'coaching'
        };

        const calendarEvent = {
          providerId: currentUser.id,
          title: actionData.title.trim(),
          description: actionData.description.trim(),
          category: categoryMap[actionData.category] || 'meditation',
          date: normalizedDate,
          startTime: actionData.eventTime,
          endTime: actionData.eventEndTime || calculateEndTime(actionData.eventTime, parseInt(actionData.duration) || 60),
          location: actionData.location || 'Por definir',
          isOnline: actionData.isOnline,
          maxParticipants: parseInt(actionData.maxParticipants) || 10,
          price: actionData.isFree ? 0 : (parseFloat(actionData.price) || 0),
          tags: [],
          permissions: actionData.permissions, // Include permissions
          isActive: actionData.isActive, // Include isActive
          isRecurring: actionData.isRecurring, // Include recurring flag
          recurringStartDate: actionData.isRecurring ? actionData.recurringStartDate : undefined,
          recurringEndDate: actionData.isRecurring ? actionData.recurringEndDate : undefined,
          selectedDays: actionData.isRecurring ? actionData.selectedDays : undefined, // Days of week for recurring events
        };

        console.log('📅 Create Action: Event data:', calendarEvent);

        if (isEditMode && editItemId) {
          // Strip prefix and timestamp suffix from ID if present
          let cleanId = editItemId.replace(/^(event-|service-|product-)/, '');
          if (cleanId.includes('-')) {
            const parts = cleanId.split('-');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 10 && !isNaN(Number(lastPart))) {
              cleanId = parts.slice(0, -1).join('-');
            }
          }
          console.log('📅 Create Action: Updating existing event:', cleanId);
          await updateEvent(cleanId, calendarEvent);
          console.log('✅ Create Action: Event updated successfully');
        } else {
          console.log('📅 Create Action: Adding new event');
          await addEvent(calendarEvent);
          console.log('✅ Create Action: Event created successfully');
        }

        Alert.alert(
          isEditMode ? 'Evento Actualizado' : 'Evento Creado',
          `Tu evento "${actionData.title}" ha sido ${isEditMode ? 'actualizado' : 'creado'} exitosamente y aparecerá en tu calendario y tablero.`,
          [
            { text: 'Ver Calendario', onPress: () => router.push('/calendar') },
            { text: 'Ver Mi Tablero', onPress: () => router.push('/mi-tablero') },
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } else if (actionData.type === 'service') {
        // Validate service-specific fields
        if (!actionData.isFree && (!actionData.price || parseFloat(actionData.price) <= 0)) {
          Alert.alert('Error', 'Debe especificar un precio válido para el servicio o activar "Sin Precio"');
          return;
        }

        if (!actionData.duration || parseInt(actionData.duration) <= 0) {
          Alert.alert('Error', 'Debe especificar una duración válida para el servicio');
          return;
        }

        // Map category for services
        const categoryMap: { [key: string]: string } = {
          'talleres': 'taller',
          'ceremonias': 'ceremonia',
          'retiros': 'retiro',
          'clases-grupales': 'clase',
          'conferencias': 'conferencia',
          'consultorias': 'consultoria',
          'terapias': 'terapia',
          'coaching': 'coaching'
        };

        // Build schedule if enabled
        let serviceSchedule = undefined;
        if (actionData.hasSchedule) {
          serviceSchedule = actionData.selectedDays.map(day => {
            const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
            return actionData.timeSlots.map(slot => {
              const [startTime, endTime] = slot.split('-');
              return {
                dayOfWeek: dayIndex,
                startTime,
                endTime,
                maxSlots: 1 // Default to 1 slot per time period
              };
            });
          }).flat();
        }

        const serviceData = {
          providerId: String(currentUser.id),
          title: actionData.title.trim(),
          description: actionData.description.trim(),
          category: categoryMap[actionData.category] || 'otros',
          price: actionData.isFree ? 0 : (parseFloat(actionData.price) || 0),
          duration: parseInt(actionData.duration) || 60,
          isOnline: actionData.isOnline,
          location: actionData.location || 'Por definir',
          tags: [],
          isScheduled: actionData.hasSchedule,
          startDate: actionData.hasSchedule ? actionData.startDate : undefined,
          endDate: actionData.hasSchedule ? actionData.endDate : undefined,
          schedule: serviceSchedule,
          permissions: actionData.permissions, // Include permissions
          isActive: actionData.isActive, // Include isActive
        };

        console.log('📋 Create Action: Service data with permissions:', serviceData);
        console.log('📋 Create Action: Permissions array:', actionData.permissions);

        if (isEditMode && editItemId) {
          // Strip prefix and timestamp suffix from ID if present
          let cleanId = editItemId.replace(/^(event-|service-|product-)/, '');
          if (cleanId.includes('-')) {
            const parts = cleanId.split('-');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 10 && !isNaN(Number(lastPart))) {
              cleanId = parts.slice(0, -1).join('-');
            }
          }
          console.log('📋 Create Action: Updating existing service:', cleanId);
          await updateService(cleanId, serviceData);
          console.log('✅ Create Action: Service updated successfully');
        } else {
          console.log('📋 Create Action: Adding new service');
          await addService(serviceData);
          console.log('✅ Create Action: Service created successfully');
        }

        const scheduleMessage = actionData.hasSchedule
          ? `\n\n🗓️ Horarios configurados:\n• Días: ${actionData.selectedDays.join(', ')}\n• Horarios: ${actionData.timeSlots.join(', ')}\n• Período: ${actionData.startDate} - ${actionData.endDate}`
          : '';

        Alert.alert(
          isEditMode ? 'Servicio Actualizado' : 'Servicio Creado',
          `Tu servicio "${actionData.title}" ha sido ${isEditMode ? 'actualizado' : 'creado'} exitosamente y aparecerá en tu tablero.${scheduleMessage}`,
          [
            { text: 'Ver Mi Tablero', onPress: () => router.push('/mi-tablero') },
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } else if (actionData.type === 'product') {
        // For products
        if (!actionData.isFree && (!actionData.price || parseFloat(actionData.price) <= 0)) {
          Alert.alert('Error', 'Debe especificar un precio válido para el producto o activar "Sin Precio"');
          return;
        }

        // Map category for products
        const categoryMap: { [key: string]: string } = {
          'artesanias': 'artesania',
          'libros': 'libro',
          'cursos': 'curso',
          'accesorios': 'accesorio',
          'decoracion': 'decoracion',
          'arte': 'arte',
          'otros': 'otros'
        };

        const productData = {
          providerId: String(currentUser.id),
          title: actionData.title.trim(),
          description: actionData.description.trim(),
          category: categoryMap[actionData.category] || 'otros',
          price: actionData.isFree ? 0 : (parseFloat(actionData.price) || 0),
          tags: [],
          isDigital: actionData.isOnline,
          isAvailable: actionData.isActive, // Map isActive to isAvailable
          permissions: actionData.permissions, // Include permissions
        };

        console.log('🛍️ Create Action: Product data:', productData);

        if (isEditMode && editItemId) {
          // Strip prefix and timestamp suffix from ID if present
          let cleanId = editItemId.replace(/^(event-|service-|product-)/, '');
          if (cleanId.includes('-')) {
            const parts = cleanId.split('-');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 10 && !isNaN(Number(lastPart))) {
              cleanId = parts.slice(0, -1).join('-');
            }
          }
          console.log('🛍️ Create Action: Updating existing product:', cleanId);
          await updateProduct(cleanId, productData);
          console.log('✅ Create Action: Product updated successfully');
        } else {
          console.log('🛍️ Create Action: Adding new product');
          await addProduct(productData);
          console.log('✅ Create Action: Product created successfully');
        }

        Alert.alert(
          isEditMode ? 'Producto Actualizado' : 'Producto Creado',
          `Tu producto "${actionData.title}" ha sido ${isEditMode ? 'actualizado' : 'creado'} exitosamente y aparecerá en tu tablero.`,
          [
            { text: 'Ver Mi Tablero', onPress: () => router.push('/mi-tablero') },
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } else if (actionData.type === 'lodging') {
        // For lodging
        if (!actionData.isFree && (!actionData.price || parseFloat(actionData.price) <= 0)) {
          Alert.alert('Error', 'Debe especificar un precio por noche válido o activar "Sin Precio"');
          return;
        }

        const lodgingData = {
          hostId: String(currentUser.id),
          host: currentUser,
          title: actionData.title.trim(),
          description: actionData.description.trim(),
          type: actionData.lodgingType as any, // retreat-center, healing-space, etc.
          pricePerNight: actionData.isFree ? 0 : (parseFloat(actionData.price) || 0),
          images: actionData.images.length > 0 ? actionData.images : [], // No fallback image
          location: actionData.location || 'Por definir',
          amenities: actionData.amenities,
          maxGuests: parseInt(actionData.maxGuests) || 4,
          rating: 0, // New listings start with 0 rating
          reviewCount: 0,
          availableDates: [], // Can be added later
        };

        console.log('🏡 Create Action: Lodging data:', lodgingData);

        if (isEditMode && editItemId) {
          let cleanId = editItemId.replace(/^(event-|service-|product-|lodging-)/, '');
          console.log('🏡 Create Action: Updating existing lodging:', cleanId);
          await updateLodging(cleanId, lodgingData);
          console.log('✅ Create Action: Lodging updated successfully');
        } else {
          console.log('🏡 Create Action: Adding new lodging');
          await addLodging(lodgingData);
          console.log('✅ Create Action: Lodging created successfully');
        }

        Alert.alert(
          isEditMode ? 'Alojamiento Actualizado' : 'Alojamiento Creado',
          `Tu alojamiento "${actionData.title}" ha sido ${isEditMode ? 'actualizado' : 'creado'} exitosamente y aparecerá en descubrir.`,
          [
            { text: 'Ver Descubrir', onPress: () => router.push('/(tabs)/discover') },
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      console.error('Create Action: Error:', error);
      Alert.alert('Error', 'Hubo un problema al crear la acción. Inténtalo de nuevo.');
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressStep,
              index + 1 <= currentStep && styles.progressStepActive
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Paso {currentStep} de {totalSteps}
      </Text>
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Qué quieres crear?</Text>
      <Text style={styles.stepSubtitle}>Elige el tipo de acción que deseas compartir</Text>

      {/* Replace ACTION_TYPES mapping with static options or remove if not needed */}
      <View style={styles.typeGrid}>
        {/* Example static buttons for 'event', 'service', 'product', 'lodging' */}
        <TouchableOpacity
          style={[styles.typeCard, actionData.type === 'event' && styles.typeCardSelected]}
          onPress={() => updateData('type', 'event')}
        >
          <View style={styles.typeCardContent}>
            <Text style={[styles.typeCardTitle, actionData.type === 'event' && styles.typeCardTitleSelected]}>🎉 Evento</Text>
            <Text style={[styles.typeCardSubtitle, actionData.type === 'event' && styles.typeCardSubtitleSelected]}>
              Talleres, ceremonias
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeCard, actionData.type === 'service' && styles.typeCardSelected]}
          onPress={() => updateData('type', 'service')}
        >
          <View style={styles.typeCardContent}>
            <Text style={[styles.typeCardTitle, actionData.type === 'service' && styles.typeCardTitleSelected]}>✨ Servicio</Text>
            <Text style={[styles.typeCardSubtitle, actionData.type === 'service' && styles.typeCardSubtitleSelected]}>
              Consultas, sesiones
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeCard, actionData.type === 'product' && styles.typeCardSelected]}
          onPress={() => updateData('type', 'product')}
        >
          <View style={styles.typeCardContent}>
            <Text style={[styles.typeCardTitle, actionData.type === 'product' && styles.typeCardTitleSelected]}>🛍️ Producto</Text>
            <Text style={[styles.typeCardSubtitle, actionData.type === 'product' && styles.typeCardSubtitleSelected]}>
              Artículos, mercancía
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeCard, actionData.type === 'lodging' && styles.typeCardSelected]}
          onPress={() => updateData('type', 'lodging')}
        >
          <View style={styles.typeCardContent}>
            <Text style={[styles.typeCardTitle, actionData.type === 'lodging' && styles.typeCardTitleSelected]}>🏡 Alojamiento</Text>
            <Text style={[styles.typeCardSubtitle, actionData.type === 'lodging' && styles.typeCardSubtitleSelected]}>
              Retiros, hospedaje
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Información básica</Text>
      <Text style={styles.stepSubtitle}>
        Cuéntanos sobre tu {getTypeLabel(actionData.type)}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Título <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de tu acción..."
          value={actionData.title}
          onChangeText={(text: string) => updateData('title', text)}
          maxLength={100}
        />
        <Text style={styles.inputHelper}>
          {actionData.title.length}/100 caracteres
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe tu acción..."
          value={actionData.description}
          onChangeText={(text: string) => updateData('description', text)}
          multiline
          numberOfLines={4}
          maxLength={300}
        />
        <Text style={styles.inputHelper}>
          {actionData.description.length}/300 caracteres
        </Text>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Precio</Text>
        <View style={styles.inputWithIcon}>
          <DollarSign size={20} color={Colors.textLight} />
          <TextInput
            style={[styles.inputWithPadding, actionData.isFree && styles.inputDisabled]}
            placeholder={actionData.isFree ? "Gratuito" : "0.00"}
            value={actionData.isFree ? "0" : actionData.price}
            onChangeText={(text: string) => !actionData.isFree && updateData('price', text)}
            keyboardType="numeric"
            editable={!actionData.isFree}
          />
          <Text style={styles.inputSuffix}>EUR</Text>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Sin Precio (Gratuito)</Text>
            <Text style={styles.switchSubtext}>Hacer este {actionData.type} completamente gratuito</Text>
          </View>
          <Switch
            value={actionData.isFree}
            onValueChange={(value: boolean) => {
              updateData('isFree', value);
              if (value) {
                updateData('price', '0');
              }
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={actionData.isFree ? Colors.white : Colors.textLight}
          />
        </View>
        <Text style={styles.inputHelper}>
          Formato: 25.00 (usa punto decimal)
        </Text>
      </View>
    </View>
  );

  const renderSpecificDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Detalles específicos</Text>
      <Text style={styles.stepSubtitle}>
        Información adicional para tu {getTypeLabel(actionData.type)}
      </Text>

      {actionData.type === 'event' && (
        <>
          {/* Recurring Event Toggle */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>¿Es este un evento recurrente?</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Evento recurrente</Text>
              <Switch
                value={actionData.isRecurring}
                onValueChange={(value) => updateData('isRecurring', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={actionData.isRecurring ? Colors.white : Colors.textLight}
              />
            </View>
            <Text style={styles.inputHelper}>
              {actionData.isRecurring
                ? 'Este evento ocurrirá múltiples veces en el rango de fechas seleccionado'
                : 'Este evento ocurrirá solo una vez'}
            </Text>
          </View>

          {/* If recurring, show date inputs for start/end */}
          {actionData.isRecurring ? (
            <>
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Fecha de inicio <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <CalendarIcon size={20} color={Colors.textLight} />
                    <TextInput
                      style={styles.inputWithPadding}
                      placeholder="DD/MM/AAAA"
                      value={actionData.recurringStartDate}
                      onChangeText={(text) => updateData('recurringStartDate', text)}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.inputHelper}>Ejemplo: 01/01/2026</Text>
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Fecha de fin <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <CalendarIcon size={20} color={Colors.textLight} />
                    <TextInput
                      style={styles.inputWithPadding}
                      placeholder="DD/MM/AAAA"
                      value={actionData.recurringEndDate}
                      onChangeText={(text) => updateData('recurringEndDate', text)}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.inputHelper}>Ejemplo: 31/12/2026</Text>
                </View>
              </View>

              {/* Day selection for recurring events */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Días de la semana <Text style={styles.required}>*</Text></Text>
                <Text style={styles.inputHelper}>Selecciona los días en que ocurre el evento</Text>
                <View style={styles.daysGrid}>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
                    const dayValue = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                    const isSelected = actionData.selectedDays.includes(dayValue);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                        onPress={() => {
                          const newDays = isSelected
                            ? actionData.selectedDays.filter(d => d !== dayValue)
                            : [...actionData.selectedDays, dayValue];
                          updateData('selectedDays', newDays);
                        }}
                      >
                        <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Time inputs for recurring events */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Hora de inicio <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <Clock size={20} color={Colors.textLight} />
                    <TextInput
                      style={styles.inputWithPadding}
                      placeholder="HH:MM"
                      value={actionData.eventTime}
                      onChangeText={(text) => updateData('eventTime', text)}
                      maxLength={5}
                    />
                  </View>
                  <Text style={styles.inputHelper}>Ejemplo: 14:30</Text>
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Hora de fin <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <Clock size={20} color={Colors.textLight} />
                    <TextInput
                      style={styles.inputWithPadding}
                      placeholder="HH:MM"
                      value={actionData.eventEndTime}
                      onChangeText={(text) => updateData('eventEndTime', text)}
                      maxLength={5}
                    />
                  </View>
                  <Text style={styles.inputHelper}>Ejemplo: 16:00</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Fecha <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWithIcon}>
                  <CalendarIcon size={20} color={Colors.textLight} />
                  <TextInput
                    style={styles.inputWithPadding}
                    placeholder="DD/MM/AAAA"
                    value={actionData.eventDate}
                    onChangeText={(text) => updateData('eventDate', text)}
                    maxLength={10}
                  />
                </View>
                <Text style={styles.inputHelper}>Ejemplo: 15/01/2026</Text>
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Hora <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWithIcon}>
                  <Clock size={20} color={Colors.textLight} />
                  <TextInput
                    style={styles.inputWithPadding}
                    placeholder="HH:MM"
                    value={actionData.eventTime}
                    onChangeText={(text) => updateData('eventTime', text)}
                    maxLength={5}
                  />
                </View>
                <Text style={styles.inputHelper}>Ejemplo: 14:30</Text>
              </View>
            </View>
          )}
        </>
      )}

      {actionData.type === 'service' && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Duración</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={20} color={Colors.textLight} />
              <TextInput
                style={styles.inputWithPadding}
                placeholder="60"
                value={actionData.duration}
                onChangeText={(text) => updateData('duration', text)}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
            <Text style={styles.inputHelper}>
              Duración en minutos (ejemplo: 60, 90, 120)
            </Text>
          </View>

          {/* Calendar Integration Toggle */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <CalendarIcon size={20} color={Colors.textLight} />
                <View>
                  <Text style={styles.switchLabel}>Integrar con calendario</Text>
                  <Text style={styles.switchSubtext}>Permite reservas por horarios específicos</Text>
                </View>
              </View>
              <Switch
                value={actionData.hasSchedule}
                onValueChange={(value) => updateData('hasSchedule', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={actionData.hasSchedule ? Colors.white : Colors.textLight}
              />
            </View>
          </View>

          {/* Schedule Configuration (only if enabled) */}
          {actionData.hasSchedule && (
            <View style={styles.scheduleSection}>
              <Text style={styles.sectionTitle}>📅 Configuración de Horarios</Text>
              {/* Date Range with text inputs */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Fecha inicio <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <CalendarIcon size={20} color={Colors.textLight} />
                    <TextInput
                      style={styles.inputWithPadding}
                      placeholder="DD/MM/AAAA"
                      value={actionData.startDate}
                      onChangeText={(text) => updateData('startDate', text)}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.inputHelper}>Ejemplo: 01/03/2026</Text>
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Fecha fin <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWithIcon}>
                    <CalendarIcon size={20} color={Colors.textLight} />
                    <TextInput
                      style={styles.inputWithPadding}
                      placeholder="DD/MM/AAAA"
                      value={actionData.endDate}
                      onChangeText={(text) => updateData('endDate', text)}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.inputHelper}>Ejemplo: 01/12/2026</Text>
                </View>
              </View>
              {/* Days Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Días disponibles <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.daysGrid}>
                  {[
                    { id: 'monday', label: 'Lun', fullName: 'Lunes' },
                    { id: 'tuesday', label: 'Mar', fullName: 'Martes' },
                    { id: 'wednesday', label: 'Mié', fullName: 'Miércoles' },
                    { id: 'thursday', label: 'Jue', fullName: 'Jueves' },
                    { id: 'friday', label: 'Vie', fullName: 'Viernes' },
                    { id: 'saturday', label: 'Sáb', fullName: 'Sábado' },
                    { id: 'sunday', label: 'Dom', fullName: 'Domingo' }
                  ].map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[styles.dayChip, actionData.selectedDays.includes(day.id) && styles.dayChipSelected]}
                      onPress={() => {
                        const selectedDays = actionData.selectedDays.includes(day.id)
                          ? actionData.selectedDays.filter(d => d !== day.id)
                          : [...actionData.selectedDays, day.id];
                        updateData('selectedDays', selectedDays);
                      }}
                    >
                      <Text style={[styles.dayLabel, actionData.selectedDays.includes(day.id) && styles.dayLabelSelected]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.inputHelper}>
                  Selecciona los días de la semana cuando ofreces el servicio
                </Text>
              </View>

              {/* Time Slots */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Horarios disponibles <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.timeSlotsContainer}>
                  {actionData.timeSlots.map((slot, index) => (
                    <View key={index} style={styles.timeSlotRow}>
                      <Text style={styles.timeSlotText}>{slot}</Text>
                      <TouchableOpacity
                        style={styles.removeSlotButton}
                        onPress={() => {
                          const timeSlots = actionData.timeSlots.filter((_, i) => i !== index);
                          updateData('timeSlots', timeSlots);
                        }}
                      >
                        <Text style={styles.removeSlotText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addSlotButton}
                    onPress={() => {
                      setIsTimeSlotModalVisible(true);
                    }}
                  >
                    <Plus size={16} color={Colors.primary} />
                    <Text style={styles.addSlotText}>Agregar horario</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHelper}>
                  Ejemplo: 10:00-12:00, 14:00-16:00 (cada horario es un slot reservable)
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Lodging-specific fields */}
      {actionData.type === 'lodging' && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Tipo de Alojamiento <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.lodging.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.categoryChip, actionData.lodgingType === type.id && styles.categoryChipSelected]}
                  onPress={() => updateData('lodgingType', type.id)}
                >
                  <Text style={styles.categoryEmoji}>{type.icon}</Text>
                  <Text style={[styles.categoryLabel, actionData.lodgingType === type.id && styles.categoryLabelSelected]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Número de huéspedes <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <Users size={20} color={Colors.textLight} />
              <TextInput
                style={styles.inputWithPadding}
                placeholder="Ej: 4"
                value={actionData.maxGuests}
                onChangeText={(text) => updateData('maxGuests', text)}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.inputHelper}>
              Cantidad máxima de huéspedes que puede alojar
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amenidades</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Jardín de Meditación, Sala de Cristales, Cocina Orgánica..."
              value={actionData.amenities.join(', ')}
              onChangeText={(text) => updateData('amenities', text.split(',').map(a => a.trim()).filter(a => a))}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.inputHelper}>
              Separa cada amenidad con una coma
            </Text>
          </View>
        </>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Categoría <Text style={styles.required}>*</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES[actionData.type].map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, actionData.category === category.id && styles.categoryChipSelected]}
              onPress={() => updateData('category', category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
              <Text style={[styles.categoryLabel, actionData.category === category.id && styles.categoryLabelSelected]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Ubicación</Text>
        <View style={styles.inputWithIcon}>
          <MapPin size={20} color={Colors.textLight} />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="Dirección o ubicación"
            value={actionData.location}
            onChangeText={(text) => updateData('location', text)}
          />
        </View>
        <Text style={styles.inputHelper}>
          Ejemplo: Calle Mayor 123, Madrid o "Online"
        </Text>
      </View>

      <View style={styles.formGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Globe size={20} color={Colors.textLight} />
            <Text style={styles.switchLabel}>Modalidad online</Text>
          </View>
          <Switch
            value={actionData.isOnline}
            onValueChange={(value) => updateData('isOnline', value)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={actionData.isOnline ? Colors.white : Colors.textLight}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Número máximo de participantes</Text>
        <View style={styles.inputWithIcon}>
          <Users size={20} color={Colors.textLight} />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="10"
            value={actionData.maxParticipants}
            onChangeText={(text) => {
              updateData('maxParticipants', text);
              updateData('availableSpots', text); // Link available spots to max participants
            }}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.inputHelper}>
          Número entero (ejemplo: 10, 20, 50)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Plazas Disponibles</Text>
        <View style={styles.inputWithIcon}>
          <Users size={20} color={Colors.textLight} />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="10"
            value={actionData.availableSpots}
            onChangeText={(text) => updateData('availableSpots', text)}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.inputHelper}>
          Número de plazas actualmente disponibles (máximo: {actionData.maxParticipants})
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>¿Qué pueden hacer las personas?</Text>
        <Text style={styles.inputHelper}>
          Selecciona las acciones que los participantes podrán realizar
        </Text>
        <View style={styles.permissionsGrid}>
          {(() => {
            // Different permissions based on type
            let permissionOptions: string[] = [];
            if (actionData.type === 'event') {
              permissionOptions = ['Ver detalles', 'Reservar', 'Comentar', 'Compartir', 'Cancelar', 'Reprogramar'];
            } else if (actionData.type === 'service') {
              permissionOptions = ['Ver detalles', 'Reservar', 'Comentar', 'Compartir', 'Cancelar', 'Reprogramar'];
            } else if (actionData.type === 'product') {
              permissionOptions = ['Ver detalles', 'Comprar', 'Comentar', 'Compartir', 'Contactar'];
            }

            return permissionOptions.map((permission) => {
              const isSelected = actionData.permissions.includes(permission);
              return (
                <TouchableOpacity
                  key={permission}
                  style={[styles.permissionButton, isSelected && styles.permissionButtonSelected]}
                  onPress={() => {
                    const newPermissions = isSelected
                      ? actionData.permissions.filter(p => p !== permission)
                      : [...actionData.permissions, permission];
                    updateData('permissions', newPermissions);
                  }}
                >
                  <Text style={[styles.permissionText, isSelected && styles.permissionTextSelected]}>
                    {permission}
                  </Text>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>

      <View style={styles.formGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Estado Activo</Text>
            <Text style={styles.switchSubtext}>Activar/desactivar este {actionData.type} para reservas</Text>
          </View>
          <Switch
            value={actionData.isActive}
            onValueChange={(value) => updateData('isActive', value)}
            trackColor={{ false: Colors.border, true: Colors.success }}
            thumbColor={actionData.isActive ? Colors.white : Colors.textLight}
          />
        </View>
      </View>
    </View>
  );

  const renderReview = () => {
    const selectedCategory = CATEGORIES[actionData.type].find(c => c.id === actionData.category);
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Revisa tu acción</Text>
        <Text style={styles.stepSubtitle}>
          Confirma que toda la información es correcta
        </Text>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewTypeIndicator}>
              <Text style={styles.reviewType}>{actionData.type === 'event' ? 'Evento' : actionData.type === 'service' ? 'Servicio' : 'Producto'}</Text>
            </View>
          </View>

          <Text style={styles.reviewTitle}>{actionData.title}</Text>
          {actionData.description && (
            <Text style={styles.reviewDescription}>{actionData.description}</Text>
          )}

          <View style={styles.reviewDetails}>
            <View style={styles.reviewDetailRow}>
              <DollarSign size={16} color={Colors.textLight} />
              <Text style={styles.reviewDetailText}>
                {actionData.price ? `€${actionData.price}` : 'Gratuito'}
              </Text>
            </View>

            {selectedCategory && (
              <View style={styles.reviewDetailRow}>
                <Tag size={16} color={Colors.textLight} />
                <Text style={styles.reviewDetailText}>
                  {selectedCategory.icon} {selectedCategory.label}
                </Text>
              </View>
            )}

            {actionData.type === 'event' && (
              <>
                {actionData.isRecurring ? (
                  <>
                    <View style={styles.reviewDetailRow}>
                      <CalendarIcon size={16} color={Colors.textLight} />
                      <Text style={styles.reviewDetailText}>
                        Evento recurrente: {actionData.recurringStartDate} - {actionData.recurringEndDate}
                      </Text>
                    </View>
                    <View style={styles.reviewDetailRow}>
                      <Clock size={16} color={Colors.textLight} />
                      <Text style={styles.reviewDetailText}>
                        {actionData.eventTime} - {actionData.eventEndTime}
                      </Text>
                    </View>
                    {actionData.selectedDays.length > 0 && (
                      <View style={styles.reviewDetailRow}>
                        <CalendarIcon size={16} color={Colors.textLight} />
                        <Text style={styles.reviewDetailText}>
                          {actionData.selectedDays.map(day => {
                            const dayMap: { [key: string]: string } = {
                              'monday': 'Lun',
                              'tuesday': 'Mar',
                              'wednesday': 'Mié',
                              'thursday': 'Jue',
                              'friday': 'Vie',
                              'saturday': 'Sáb',
                              'sunday': 'Dom'
                            };
                            return dayMap[day];
                          }).join(', ')}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  actionData.eventDate && (
                    <View style={styles.reviewDetailRow}>
                      <CalendarIcon size={16} color={Colors.textLight} />
                      <Text style={styles.reviewDetailText}>
                        {actionData.eventDate} a las {actionData.eventTime}
                      </Text>
                    </View>
                  )
                )}
              </>
            )}

            {actionData.type === 'service' && (
              <View style={styles.reviewDetailRow}>
                <Clock size={16} color={Colors.textLight} />
                <Text style={styles.reviewDetailText}>
                  {actionData.duration} minutos
                </Text>
              </View>
            )}

            {actionData.location && (
              <View style={styles.reviewDetailRow}>
                <MapPin size={16} color={Colors.textLight} />
                <Text style={styles.reviewDetailText}>
                  {actionData.location}
                </Text>
              </View>
            )}

            <View style={styles.reviewDetailRow}>
              <Users size={16} color={Colors.textLight} />
              <Text style={styles.reviewDetailText}>
                Máximo {actionData.maxParticipants} participantes
              </Text>
            </View>

            {actionData.isOnline && (
              <View style={styles.reviewDetailRow}>
                <Globe size={16} color={Colors.textLight} />
                <Text style={styles.reviewDetailText}>
                  Modalidad online
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderTypeSelection();
      case 2:
        return renderBasicInfo();
      case 3:
        return renderSpecificDetails();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Editar Acción' : 'Crear Acción'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {renderProgressBar()}

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={prevStep}>
              <Text style={styles.navButtonText}>Anterior</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              currentStep === 1 && styles.navButtonSingle
            ]}
            onPress={currentStep === totalSteps ? handleSubmit : nextStep}
          >
            <Text style={styles.navButtonPrimaryText}>
              {currentStep === totalSteps
                ? (isEditMode ? 'Guardar' : 'Crear')
                : 'Siguiente'}
            </Text>
            {/* Removed chevron icon for Siguiente button as requested */}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Time Slot Input Modal */}
      <Modal
        visible={isTimeSlotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTimeSlotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Horario</Text>
            <Text style={styles.modalSubtitle}>
              Ingrese el horario en formato HH:MM-HH:MM
            </Text>
            <Text style={styles.modalExample}>
              Ejemplo: 10:00-12:00 o 14:30-16:30
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="10:00-12:00"
              value={newTimeSlot}
              onChangeText={setNewTimeSlot}
              maxLength={11}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsTimeSlotModalVisible(false);
                  setNewTimeSlot('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  const timeSlotRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
                  if (!newTimeSlot.trim()) {
                    Alert.alert('Error', 'Por favor ingrese un horario');
                    return;
                  }
                  if (!timeSlotRegex.test(newTimeSlot)) {
                    Alert.alert('Error', 'Formato incorrecto. Use HH:MM-HH:MM (ejemplo: 10:00-12:00)');
                    return;
                  }
                  if (actionData.timeSlots.includes(newTimeSlot)) {
                    Alert.alert('Error', 'Este horario ya existe');
                    return;
                  }

                  const timeSlots = [...actionData.timeSlots, newTimeSlot];
                  updateData('timeSlots', timeSlots);
                  setIsTimeSlotModalVisible(false);
                  setNewTimeSlot('');
                }}
              >
                <Text style={styles.modalConfirmText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 32,
  },
  typeGrid: {
    gap: 16,
  },
  typeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 20,
  },
  typeCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeCardContent: {
    alignItems: 'center',
  },
  typeCardGradient: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  typeCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  typeCardTitleSelected: {
    color: Colors.white,
  },
  typeCardSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  typeCardSubtitleSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  formGroup: {
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    gap: 12,
  },
  inputWithPadding: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.background,
  },
  inputSuffix: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  inputHelper: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    gap: 8,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  categoryLabelSelected: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  reviewDescription: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
  reviewDetails: {
    gap: 12,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDetailText: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 0,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  navButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    flexDirection: 'row',
    gap: 8,
  },
  navButtonSingle: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlignVertical: 'center',
    textAlign: 'center',
    flex: 1,
  },
  navButtonPrimaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlignVertical: 'center',
    textAlign: 'center',
    paddingVertical: 0,
    includeFontPadding: false,
  },

  // Schedule styles
  scheduleSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  switchSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayChip: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  dayLabelSelected: {
    color: Colors.white,
  },
  timeSlotsContainer: {
    marginTop: 8,
    gap: 8,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  removeSlotButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSlotText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  addSlotText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalExample: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 0,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    display: 'flex',
    flexDirection: 'row',
  },
  modalCancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary,
  },
  modalCancelText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
    textAlignVertical: 'center',
    textAlign: 'center',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  modalConfirmText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
    textAlignVertical: 'center',
    textAlign: 'center',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  // New styles for enhanced functionality
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  permissionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  permissionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  permissionTextSelected: {
    color: Colors.white,
  },
});