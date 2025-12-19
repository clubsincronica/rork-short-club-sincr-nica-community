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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ImageIcon,
  Type,
  FileText,
} from '../components/SmartIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCalendar } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { CalendarEvent, ServiceCategory } from '@/types/user';

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; icon: string }[] = [
  { value: 'yoga', label: 'Yoga', icon: '🧘‍♀️' },
  { value: 'meditation', label: 'Meditación', icon: '🧘' },
  { value: 'healing', label: 'Sanación', icon: '✨' },
  { value: 'coaching', label: 'Coaching', icon: '💪' },
  { value: 'therapy', label: 'Terapia', icon: '🌱' },
  { value: 'nutrition', label: 'Nutrición', icon: '🥗' },
  { value: 'energy-work', label: 'Trabajo Energético', icon: '⚡' },
  { value: 'spiritual-guidance', label: 'Guía Espiritual', icon: '🔮' },
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30',
];

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1.5 horas', value: 90 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
];

export default function AddEventScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const { addEvent, updateEvent, events } = useCalendar();
  const params = useLocalSearchParams();
  
  // Check if we're editing an existing event
  const editingEventId = params.eventId as string;
  const editingEvent = editingEventId ? events.find((e: CalendarEvent) => e.id === editingEventId) : null;
  const isEditing = !!editingEvent;

  const [currentStep, setCurrentStep] = useState(1);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'yoga' as ServiceCategory,
    date: '',
    startTime: '',
    duration: 60,
    location: '',
    isOnline: false,
    maxParticipants: 10,
    price: 0,
    tags: '',
    requiresApproval: false,
    allowCancellation: true,
    cancellationHours: 24,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing event data if editing
  useEffect(() => {
    if (editingEvent) {
      const endTime = editingEvent.endTime;
      const startTime = editingEvent.startTime;
      const duration = calculateDuration(startTime, endTime);
      
      setEventForm({
        title: editingEvent.title,
        description: editingEvent.description,
        category: editingEvent.category,
        date: editingEvent.date,
        startTime: editingEvent.startTime,
        duration,
        location: editingEvent.location || '',
        isOnline: editingEvent.isOnline,
        maxParticipants: editingEvent.maxParticipants,
        price: editingEvent.price,
        tags: editingEvent.tags.join(', '),
        requiresApproval: false, // Default values for new fields
        allowCancellation: true,
        cancellationHours: 24,
      });
    } else {
      // Set default date to today if creating new event
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setEventForm(prev => ({ ...prev, date: dateString }));
    }
  }, [editingEvent]);

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!eventForm.title.trim()) {
        newErrors.title = 'El título es requerido';
      }
      if (!eventForm.description.trim()) {
        newErrors.description = 'La descripción es requerida';
      }
    }

    if (step === 2) {
      if (!eventForm.date) {
        newErrors.date = 'La fecha es requerida';
      }
      if (!eventForm.startTime) {
        newErrors.startTime = 'La hora de inicio es requerida';
      }
      if (eventForm.maxParticipants < 1) {
        newErrors.maxParticipants = 'Debe permitir al menos 1 participante';
      }
    }

    if (step === 3) {
      if (!eventForm.isOnline && !eventForm.location.trim()) {
        newErrors.location = 'La ubicación es requerida para eventos presenciales';
      }
      if (eventForm.price < 0) {
        newErrors.price = 'El precio no puede ser negativo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!currentUser) {
        Alert.alert('Iniciar Sesión', 'Por favor inicia sesión para crear un evento.');
        setIsSubmitting(false);
        return;
      }
      const endTime = calculateEndTime(eventForm.startTime, eventForm.duration);
      const eventData = {
        providerId: currentUser.id,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        category: eventForm.category,
        date: eventForm.date,
        startTime: eventForm.startTime,
        endTime,
        location: eventForm.location.trim(),
        isOnline: eventForm.isOnline,
        maxParticipants: eventForm.maxParticipants,
        price: eventForm.price,
        tags: eventForm.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      if (isEditing && editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        Alert.alert('Éxito', 'Evento actualizado exitosamente.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await addEvent(eventData);
        Alert.alert('Éxito', 'Evento creado exitosamente.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Hubo un problema al guardar el evento. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep === step && styles.stepCircleCurrent,
          ]}>
            {currentStep > step ? (
              <Check size={16} color={Colors.white} />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Type size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Información Básica</Text>
        <Text style={styles.stepSubtitle}>Cuéntanos sobre tu evento</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Título del Evento *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={eventForm.title}
          onChangeText={(text) => {
            setEventForm({ ...eventForm, title: text });
            if (errors.title) setErrors({ ...errors, title: '' });
          }}
          placeholder="Ej: Sesión de Yoga Matutina"
          maxLength={100}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          value={eventForm.description}
          onChangeText={(text) => {
            setEventForm({ ...eventForm, description: text });
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
          placeholder="Describe tu evento, qué incluye, qué deben traer los participantes..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        <Text style={styles.characterCount}>
          {eventForm.description.length}/500 caracteres
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {SERVICE_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                eventForm.category === cat.value && styles.categoryChipActive,
              ]}
              onPress={() => setEventForm({ ...eventForm, category: cat.value })}
            >
              <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              <Text style={[
                styles.categoryChipText,
                eventForm.category === cat.value && styles.categoryChipTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <CalendarIcon size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Fecha y Horario</Text>
        <Text style={styles.stepSubtitle}>¿Cuándo será tu evento?</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Fecha *</Text>
        <TextInput
          style={[styles.input, errors.date && styles.inputError]}
          value={eventForm.date}
          onChangeText={(text) => {
            setEventForm({ ...eventForm, date: text });
            if (errors.date) setErrors({ ...errors, date: '' });
          }}
          placeholder="YYYY-MM-DD"
        />
        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.inputGroupHalf]}>
          <Text style={styles.inputLabel}>Hora de Inicio *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
            {TIME_SLOTS.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChip,
                  eventForm.startTime === time && styles.timeChipActive,
                ]}
                onPress={() => {
                  setEventForm({ ...eventForm, startTime: time });
                  if (errors.startTime) setErrors({ ...errors, startTime: '' });
                }}
              >
                <Text style={[
                  styles.timeChipText,
                  eventForm.startTime === time && styles.timeChipTextActive,
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duración</Text>
        <View style={styles.durationContainer}>
          {DURATION_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.durationChip,
                eventForm.duration === option.value && styles.durationChipActive,
              ]}
              onPress={() => setEventForm({ ...eventForm, duration: option.value })}
            >
              <Text style={[
                styles.durationChipText,
                eventForm.duration === option.value && styles.durationChipTextActive,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Máximo de Participantes</Text>
        <View style={styles.participantsContainer}>
          <TouchableOpacity
            style={styles.participantsButton}
            onPress={() => setEventForm({ 
              ...eventForm, 
              maxParticipants: Math.max(1, eventForm.maxParticipants - 1) 
            })}
          >
            <Text style={styles.participantsButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.participantsValue}>{eventForm.maxParticipants}</Text>
          <TouchableOpacity
            style={styles.participantsButton}
            onPress={() => setEventForm({ 
              ...eventForm, 
              maxParticipants: Math.min(100, eventForm.maxParticipants + 1) 
            })}
          >
            <Text style={styles.participantsButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {errors.maxParticipants && <Text style={styles.errorText}>{errors.maxParticipants}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <MapPin size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Ubicación y Precio</Text>
        <Text style={styles.stepSubtitle}>Detalles del lugar y costo</Text>
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchLeft}>
          <Globe size={20} color={Colors.primary} />
          <Text style={styles.switchLabel}>Evento Online</Text>
        </View>
        <Switch
          value={eventForm.isOnline}
          onValueChange={(value) => {
            setEventForm({ ...eventForm, isOnline: value });
            if (value && errors.location) {
              setErrors({ ...errors, location: '' });
            }
          }}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {eventForm.isOnline ? 'Enlace de la Reunión' : 'Ubicación *'}
        </Text>
        <TextInput
          style={[styles.input, errors.location && styles.inputError]}
          value={eventForm.location}
          onChangeText={(text) => {
            setEventForm({ ...eventForm, location: text });
            if (errors.location) setErrors({ ...errors, location: '' });
          }}
          placeholder={eventForm.isOnline ? 
            "https://zoom.us/j/123456789" : 
            "Dirección completa del lugar"
          }
        />
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Precio (€)</Text>
        <View style={styles.priceContainer}>
          <DollarSign size={20} color={Colors.textLight} />
          <TextInput
            style={[styles.priceInput, errors.price && styles.inputError]}
            value={eventForm.price.toString()}
            onChangeText={(text) => {
              const price = parseFloat(text) || 0;
              setEventForm({ ...eventForm, price });
              if (errors.price) setErrors({ ...errors, price: '' });
            }}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        <Text style={styles.inputHint}>
          Deja en 0 si el evento es gratuito
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Etiquetas (opcional)</Text>
        <TextInput
          style={styles.input}
          value={eventForm.tags}
          onChangeText={(text) => setEventForm({ ...eventForm, tags: text })}
          placeholder="relajación, principiantes, meditación"
        />
        <Text style={styles.inputHint}>
          Separa las etiquetas con comas para ayudar a los usuarios a encontrar tu evento
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Check size={24} color={Colors.primary} />
        <Text style={styles.stepTitle}>Revisión Final</Text>
        <Text style={styles.stepSubtitle}>Confirma los detalles de tu evento</Text>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>{eventForm.title}</Text>
          <View style={styles.reviewCategory}>
            <Text style={styles.reviewCategoryText}>
              {SERVICE_CATEGORIES.find(c => c.value === eventForm.category)?.label}
            </Text>
          </View>
        </View>

        <Text style={styles.reviewDescription} numberOfLines={3}>
          {eventForm.description}
        </Text>

        <View style={styles.reviewDetails}>
          <View style={styles.reviewDetail}>
            <CalendarIcon size={16} color={Colors.primary} />
            <Text style={styles.reviewDetailText}>{eventForm.date}</Text>
          </View>
          <View style={styles.reviewDetail}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.reviewDetailText}>
              {eventForm.startTime} - {calculateEndTime(eventForm.startTime, eventForm.duration)}
            </Text>
          </View>
          <View style={styles.reviewDetail}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.reviewDetailText}>
              {eventForm.isOnline ? 'Online' : eventForm.location}
            </Text>
          </View>
          <View style={styles.reviewDetail}>
            <Users size={16} color={Colors.primary} />
            <Text style={styles.reviewDetailText}>
              Máx. {eventForm.maxParticipants} participantes
            </Text>
          </View>
          <View style={styles.reviewDetail}>
            <DollarSign size={16} color={Colors.primary} />
            <Text style={styles.reviewDetailText}>
              {eventForm.price > 0 ? `€${eventForm.price}` : 'Gratuito'}
            </Text>
          </View>
        </View>

        {eventForm.tags && (
          <View style={styles.reviewTags}>
            {eventForm.tags.split(',').map((tag, index) => (
              <View key={index} style={styles.reviewTag}>
                <Text style={styles.reviewTagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Evento' : 'Crear Evento'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePrevious}>
            <Text style={styles.secondaryButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 4 ? (
          <TouchableOpacity 
            style={[styles.primaryButton, currentStep === 1 && styles.primaryButtonFull]} 
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryButton, styles.primaryButtonFull]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Evento' : 'Crear Evento')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: Colors.secondary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  inputHint: {
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
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
    backgroundColor: Colors.white,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  timeScroll: {
    marginTop: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.white,
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  timeChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  durationChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationChipText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  durationChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  participantsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  participantsValue: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 32,
    minWidth: 60,
    textAlign: 'center',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  priceInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  reviewCategory: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewCategoryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  reviewDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewDetails: {
    gap: 8,
    marginBottom: 16,
  },
  reviewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDetailText: {
    fontSize: 14,
    color: Colors.text,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewTagText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 50,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
