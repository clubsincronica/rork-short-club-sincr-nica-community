import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, Users, Tag, ImageIcon } from '@/components/SmartIcons';
import { Colors, TabThemes } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { FloatingCard } from '@/components/FloatingCard';
import { TouchableScale } from '@/components/TouchableScale';
import { useUser } from '@/hooks/user-store';
import { useCalendar } from '@/hooks/calendar-store';

type ServiceType = 'service' | 'event' | 'product';

interface ServiceFormData {
  type: ServiceType;
  title: string;
  description: string;
  price: string;
  duration: string;
  category: string;
  location: string;
  isOnline: boolean;
  maxParticipants: string;
  images: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  // Event-specific fields
  eventDate?: string;
  eventTime?: string;
}

const serviceCategories = {
  service: ['Sanación', 'Coaching', 'Terapias', 'Consultoría', 'Belleza', 'Fitness'],
  event: ['Talleres', 'Ceremonias', 'Retiros', 'Clases Grupales', 'Conferencias'],
  product: ['Cristales', 'Aceites', 'Libros', 'Artesanías', 'Suplementos']
};

const availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AddServiceScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const { addEvent } = useCalendar();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<ServiceFormData>({
    type: 'service',
    title: '',
    description: '',
    price: '',
    duration: '60',
    category: '',
    location: '',
    isOnline: false,
    maxParticipants: '1',
    images: [],
    availability: {
      days: [],
      startTime: '09:00',
      endTime: '18:00',
    },
    eventDate: '',
    eventTime: '',
  });

  const updateFormData = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('🔥 Add Service: handleSubmit called with form data:', formData);
      
      if (!currentUser) {
        console.log('❌ Add Service: No current user found');
        Alert.alert('Error', 'Usuario no encontrado');
        return;
      }

      console.log('✅ Add Service: Current user:', currentUser.name, currentUser.id);

      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
        console.log('❌ Add Service: Validation failed - missing required fields');
        Alert.alert('Error', 'Por favor completa todos los campos requeridos');
        return;
      }

      console.log('✅ Add Service: Validation passed');

      // Convert and normalize date format for consistent storage
      let normalizedEventDate = formData.eventDate;
      if (formData.eventDate && formData.eventDate.includes('/')) {
        const parts = formData.eventDate.split('/');
        if (parts.length === 3 && parts[0].length <= 2) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const [day, month, year] = parts;
          normalizedEventDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('🔄 Add Service: Normalized priority item date:', formData.eventDate, '->', normalizedEventDate);
        }
      }

      // For events, add directly to calendar - Mi Tablero will automatically show them
      // For services, add to services store (future implementation)
      
      if (formData.type === 'event') {
        // Events must have date and time to be added to calendar
        if (!formData.eventDate || !formData.eventTime) {
          Alert.alert('Error', 'Los eventos requieren fecha y hora para ser creados.');
          return;
        }
        
        console.log('📅 Add Service: Creating event for calendar...');
        console.log('📅 Add Service: This is an event with date, adding to calendar...');
        
        // Convert date format if needed (DD/MM/YYYY -> YYYY-MM-DD)
        let normalizedDate = formData.eventDate;
        if (formData.eventDate.includes('/')) {
          const parts = formData.eventDate.split('/');
          if (parts.length === 3 && parts[0].length <= 2) {
            // This is DD/MM/YYYY format, convert to YYYY-MM-DD
            const [day, month, year] = parts;
            normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log('🔄 Add Service: Converted date format:', formData.eventDate, '->', normalizedDate);
          }
        }
        
        // Map category to calendar categories
        const categoryMap: { [key: string]: string } = {
          'Talleres': 'yoga',
          'Ceremonias': 'spiritual-guidance',
          'Retiros': 'meditation',
          'Clases Grupales': 'yoga',
          'Conferencias': 'coaching'
        };

        const calculateEndTime = (startTime: string, durationMinutes: number) => {
          const [hours, minutes] = startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
          return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        };

        const calendarEvent = {
          providerId: currentUser.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: categoryMap[formData.category] || 'meditation',
          date: normalizedDate, // Use normalized date
          startTime: formData.eventTime,
          endTime: calculateEndTime(formData.eventTime, parseInt(formData.duration) || 60),
          location: formData.location || 'Por definir',
          isOnline: formData.isOnline,
          maxParticipants: parseInt(formData.maxParticipants) || 10,
          price: parseFloat(formData.price) || 0,
          tags: []
        };

        console.log('📝 Add Service: Calendar event prepared with normalized date:', calendarEvent);
        await addEvent(calendarEvent);
        console.log('✅ Add Service: Event added to calendar successfully');
      } else {
        // For services and products, add to their respective stores (future implementation)
        console.log('📋 Add Service: Service/Product created (will be added to services store in future)');
      }

      const itemType = formData.type === 'event' ? 'evento' : formData.type === 'service' ? 'servicio' : 'producto';
      
      Alert.alert(
        `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Creado`,
        `Tu ${itemType} "${formData.title}" ha sido creado exitosamente y estará disponible en ${formData.type === 'event' ? 'tu calendario y' : ''} tu tablero.`,
        [
          { text: 'Ver Mi Tablero', onPress: () => router.push('/mi-tablero') },
          ...(formData.type === 'event' ? [{ text: 'Ver Calendario', onPress: () => router.push('/calendar') }] : []),
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('Add Service: Error saving data:', error);
      Alert.alert('Error', 'Hubo un problema al guardar. Inténtalo de nuevo.');
    }
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
      <Text style={styles.progressText}>Paso {currentStep} de {totalSteps}</Text>
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Qué quieres ofrecer?</Text>
      <Text style={styles.stepSubtitle}>Selecciona el tipo de oferta que deseas crear</Text>
      
      <View style={styles.typeGrid}>
        {[
          { type: 'service', icon: '🙏', title: 'Servicio', description: 'Sesiones individuales o grupales' },
          { type: 'event', icon: '📅', title: 'Evento', description: 'Talleres, ceremonias, retiros' },
          { type: 'product', icon: '🛍️', title: 'Producto', description: 'Artículos físicos o digitales' }
        ].map((option) => (
          <TouchableScale
            key={option.type}
            style={[
              styles.typeCard,
              formData.type === option.type && styles.typeCardSelected
            ]}
            onPress={() => updateFormData('type', option.type as ServiceType)}
          >
            <Text style={styles.typeIcon}>{option.icon}</Text>
            <Text style={styles.typeTitle}>{option.title}</Text>
            <Text style={styles.typeDescription}>{option.description}</Text>
          </TouchableScale>
        ))}
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Información Básica</Text>
      <Text style={styles.stepSubtitle}>Describe tu {formData.type}</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder={`Nombre de tu ${formData.type}`}
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe detalladamente lo que ofreces..."
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Precio *</Text>
          <TextInput
            style={styles.input}
            placeholder="€45"
            value={formData.price}
            onChangeText={(value) => updateFormData('price', value)}
            keyboardType="numeric"
          />
        </View>

        {formData.type !== 'product' && (
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Duración (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="60"
              value={formData.duration}
              onChangeText={(value) => updateFormData('duration', value)}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* Event-specific date and time fields */}
      {formData.type === 'event' && (
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Fecha del Evento *</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={formData.eventDate}
              onChangeText={(value) => updateFormData('eventDate', value)}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Hora de Inicio *</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              value={formData.eventTime}
              onChangeText={(value) => updateFormData('eventTime', value)}
            />
          </View>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Categoría *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {serviceCategories[formData.type].map((category) => (
            <TouchableScale
              key={category}
              style={[
                styles.categoryTag,
                formData.category === category && styles.categoryTagSelected
              ]}
              onPress={() => updateFormData('category', category)}
            >
              <Text style={[
                styles.categoryTagText,
                formData.category === category && styles.categoryTagTextSelected
              ]}>
                {category}
              </Text>
            </TouchableScale>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderLocationAvailability = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Ubicación y Disponibilidad</Text>
      <Text style={styles.stepSubtitle}>¿Dónde y cuándo estará disponible?</Text>

      <View style={styles.formGroup}>
        <View style={styles.toggleRow}>
          <TouchableScale
            style={[
              styles.toggleButton,
              !formData.isOnline && styles.toggleButtonActive
            ]}
            onPress={() => updateFormData('isOnline', false)}
          >
            <MapPin size={20} color={!formData.isOnline ? Colors.white : Colors.textLight} />
            <Text style={[
              styles.toggleButtonText,
              !formData.isOnline && styles.toggleButtonTextActive
            ]}>
              Presencial
            </Text>
          </TouchableScale>

          <TouchableScale
            style={[
              styles.toggleButton,
              formData.isOnline && styles.toggleButtonActive
            ]}
            onPress={() => updateFormData('isOnline', true)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.isOnline && styles.toggleButtonTextActive
            ]}>
              🌐 Online
            </Text>
          </TouchableScale>
        </View>
      </View>

      {!formData.isOnline && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ubicación</Text>
          <TextInput
            style={styles.input}
            placeholder="Dirección o zona donde se realizará"
            value={formData.location}
            onChangeText={(value) => updateFormData('location', value)}
          />
        </View>
      )}

      {formData.type !== 'product' && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Días Disponibles</Text>
            <View style={styles.daysGrid}>
              {availableDays.map((day) => (
                <TouchableScale
                  key={day}
                  style={[
                    styles.dayTag,
                    formData.availability.days.includes(day) && styles.dayTagSelected
                  ]}
                  onPress={() => {
                    const newDays = formData.availability.days.includes(day)
                      ? formData.availability.days.filter(d => d !== day)
                      : [...formData.availability.days, day];
                    updateFormData('availability', { ...formData.availability, days: newDays });
                  }}
                >
                  <Text style={[
                    styles.dayTagText,
                    formData.availability.days.includes(day) && styles.dayTagTextSelected
                  ]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableScale>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Hora Inicio</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                value={formData.availability.startTime}
                onChangeText={(value) => updateFormData('availability', { ...formData.availability, startTime: value })}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Hora Fin</Text>
              <TextInput
                style={styles.input}
                placeholder="18:00"
                value={formData.availability.endTime}
                onChangeText={(value) => updateFormData('availability', { ...formData.availability, endTime: value })}
              />
            </View>
          </View>
        </>
      )}

      {formData.type === 'event' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Máximo Participantes</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            value={formData.maxParticipants}
            onChangeText={(value) => updateFormData('maxParticipants', value)}
            keyboardType="numeric"
          />
        </View>
      )}
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Revisa tu {formData.type}</Text>
      <Text style={styles.stepSubtitle}>Confirma que toda la información es correcta</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>{formData.title}</Text>
          <Text style={styles.reviewPrice}>{formData.price}</Text>
        </View>
        
        <Text style={styles.reviewDescription}>{formData.description}</Text>
        
        <View style={styles.reviewDetails}>
          <View style={styles.reviewDetailItem}>
            <Tag size={16} color={Colors.textLight} />
            <Text style={styles.reviewDetailText}>{formData.category}</Text>
          </View>
          
          {formData.type === 'event' && formData.eventDate && (
            <View style={styles.reviewDetailItem}>
              <Calendar size={16} color={Colors.textLight} />
              <Text style={styles.reviewDetailText}>
                {formData.eventDate} {formData.eventTime && `a las ${formData.eventTime}`}
              </Text>
            </View>
          )}
          
          {formData.type !== 'product' && (
            <View style={styles.reviewDetailItem}>
              <Clock size={16} color={Colors.textLight} />
              <Text style={styles.reviewDetailText}>{formData.duration} min</Text>
            </View>
          )}

          <View style={styles.reviewDetailItem}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.reviewDetailText}>
              {formData.isOnline ? 'Online' : formData.location || 'Presencial'}
            </Text>
          </View>

          {formData.availability.days.length > 0 && (
            <View style={styles.reviewDetailItem}>
              <Calendar size={16} color={Colors.textLight} />
              <Text style={styles.reviewDetailText}>
                {formData.availability.days.join(', ')} • {formData.availability.startTime}-{formData.availability.endTime}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTypeSelection();
      case 2:
        return renderBasicInfo();
      case 3:
        return renderLocationAvailability();
      case 4:
        return renderReview();
      default:
        return renderTypeSelection();
    }
  };

  return (
    <ConstellationBackground intensity="light">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <LinearGradient
          colors={TabThemes.services.headerGradient}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Añadir Servicio</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        {renderProgressBar()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.navButtonSecondary} onPress={prevStep}>
              <Text style={styles.navButtonSecondaryText}>Anterior</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.navButtonPrimary, currentStep === 1 && { flex: 1 }]}
            onPress={currentStep === totalSteps ? handleSubmit : nextStep}
          >
            <Text style={styles.navButtonPrimaryText}>
              {currentStep === totalSteps ? 'Crear Servicio' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ConstellationBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: TabThemes.services.accentColor,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginBottom: 24,
  },
  typeGrid: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeCardSelected: {
    borderColor: TabThemes.services.accentColor,
    backgroundColor: TabThemes.services.accentColor + '10',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 4,
  },
  categoryTag: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryTagSelected: {
    backgroundColor: TabThemes.services.accentColor,
    borderColor: TabThemes.services.accentColor,
  },
  categoryTagText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryTagTextSelected: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: TabThemes.services.accentColor,
    borderColor: TabThemes.services.accentColor,
  },
  toggleButtonText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  toggleButtonTextActive: {
    color: Colors.white,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayTag: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayTagSelected: {
    backgroundColor: TabThemes.services.accentColor,
    borderColor: TabThemes.services.accentColor,
  },
  dayTagText: {
    fontSize: 14,
    color: Colors.text,
  },
  dayTagTextSelected: {
    color: Colors.white,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    margin: 16,
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
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  reviewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: TabThemes.services.accentColor,
  },
  reviewDescription: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
  reviewDetails: {
    gap: 8,
  },
  reviewDetailItem: {
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
  navButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: TabThemes.services.accentColor,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});