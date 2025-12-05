import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { 
  X, 
  Save, 
  Camera, 
  Calendar, 
  Package, 
  Tag as TagIcon,
  Plus,
} from '@/components/SmartIcons';
import { SlotSelectionModal } from './SlotSelectionModal';
import { Colors } from '@/constants/colors';
import { ProfilePriorityItem } from '@/types/user';
import * as ImagePicker from 'expo-image-picker';

interface PriorityItemManagerProps {
  visible: boolean;
  item?: ProfilePriorityItem | null;
  onClose: () => void;
  onSave: (item: Omit<ProfilePriorityItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

// Initial state for the form 
const initialFormState = {
  type: 'service' as ProfilePriorityItem['type'],
  title: '',
  description: '',
  image: '',
  price: 0,
  currency: 'EUR',
  category: '',
  tags: [] as string[],
  priority: 1,
  isActive: true,
  validUntil: '',
  actionButton: {
    label: 'Contactar',
    action: 'contact' as 'contact' | 'book' | 'buy' | 'external-link',
    url: ''
  },
  availability: {
    available: 10,
    total: 10
  },
  showPrice: false,
  showAvailability: false,
  showActionButton: true,
  tagInput: '',
  // Additional fields for different types
  eventDate: '',
  eventTime: '',
  location: '',
  duration: '',
  maxParticipants: 0,
  // Service scheduling fields
  isScheduled: false,
  startDate: '',
  endDate: '',
  schedule: [] as any[]
};

export function PriorityItemManager({ visible, item, onClose, onSave }: PriorityItemManagerProps) {
  // Proper React state management
  const [formState, setFormState] = useState(() => ({ ...initialFormState }));
  const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
  
  // Initialize form state when modal becomes visible
  useEffect(() => {
    if (visible) {
      if (item) {
        // Initialize with existing item data
        setFormState({
          type: item.type,
          title: item.title,
          description: item.description,
          image: item.image || '',
          price: item.price || 0,
          currency: item.currency || 'EUR',
          category: item.category || '',
          tags: [...(item.tags || [])],
          priority: item.priority,
          isActive: item.isActive,
          validUntil: item.validUntil || '',
          actionButton: item.actionButton ? {
            label: item.actionButton.label,
            action: item.actionButton.action,
            url: item.actionButton.url || ''
          } : { label: 'Contactar', action: 'contact', url: '' },
          availability: item.availability || { available: 10, total: 10 },
          showPrice: !!item.price,
          showAvailability: !!item.availability,
          showActionButton: true,
          tagInput: '',
          // Event-specific fields from metadata
          eventDate: item.metadata?.date || '',
          eventTime: item.metadata?.startTime || '',
          location: item.metadata?.location || '',
          duration: String(item.metadata?.duration || ''),
          maxParticipants: item.metadata?.maxParticipants || 0,
          // Service scheduling fields
          isScheduled: (item.metadata as any)?.isScheduled || false,
          startDate: (item.metadata as any)?.startDate || '',
          endDate: (item.metadata as any)?.endDate || '',
          schedule: [...((item.metadata as any)?.schedule || [])]
        });
      } else {
        // Reset for new item
        setFormState({
          type: 'service',
          title: '',
          description: '',
          image: '',
          price: 0,
          currency: 'EUR',
          category: '',
          tags: [],
          priority: 1,
          isActive: true,
          validUntil: '',
          actionButton: { label: 'Contactar', action: 'contact', url: '' },
          availability: { available: 10, total: 10 },
          showPrice: false,
          showAvailability: false,
          showActionButton: true,
          tagInput: '',
          eventDate: '',
          eventTime: '',
          location: '',
          duration: '',
          maxParticipants: 0,
          // Service scheduling fields
          isScheduled: false,
          startDate: '',
          endDate: '',
          schedule: []
        });
      }
    }
  }, [visible, item]);

  const updateField = (field: string, value: any) => {
    console.log('PriorityItemManager: updateField called', field, value);
    setFormState(prev => {
      const newState = { ...prev, [field]: value };
      console.log('PriorityItemManager: state updated', field, '=', value);
      return newState;
    });
  };

  const typeOptions = [
    { 
      value: 'service', 
      label: 'Servicio', 
      icon: Calendar,
      description: 'Sesiones, terapias, consultas personalizadas',
      color: '#4f8497'
    },
    { 
      value: 'product', 
      label: 'Producto', 
      icon: Package,
      description: 'Cristales, aceites, libros, artículos físicos',
      color: '#7c3aed'
    },
    { 
      value: 'event', 
      label: 'Evento', 
      icon: Calendar,
      description: 'Talleres, retiros, ceremonias, actividades grupales',
      color: '#059669'
    },
    { 
      value: 'announcement', 
      label: 'Anuncio', 
      icon: Calendar,
      description: 'Noticias, actualizaciones, mensajes importantes',
      color: '#0ea5e9'
    },
    { 
      value: 'special-offer', 
      label: 'Oferta Especial', 
      icon: TagIcon,
      description: 'Promociones limitadas, descuentos, paquetes',
      color: '#dc2626'
    },
  ];

  const actionOptions = [
    { value: 'contact', label: 'Contactar', description: 'Abrir chat o llamada' },
    { value: 'book', label: 'Reservar', description: 'Agendar cita o sesión' },
    { value: 'buy', label: 'Comprar', description: 'Proceso de compra directa' },
    { value: 'external-link', label: 'Enlace Externo', description: 'Ir a página web externa' },
  ];

  const getPlaceholderForType = (type: string, field: string) => {
    const placeholders = {
      service: {
        title: 'Ej: Sesión de Reiki Personalizada',
        description: 'Describe tu servicio, duración, beneficios...',
        category: 'Ej: Sanación Energética'
      },
      product: {
        title: 'Ej: Cristal de Cuarzo Rosa',
        description: 'Describe el producto, sus características...',
        category: 'Ej: Cristales y Minerales'
      },
      event: {
        title: 'Ej: Taller de Meditación Lunar',
        description: 'Describe el evento, actividades, qué incluye...',
        category: 'Ej: Talleres y Retiros'
      },
      announcement: {
        title: 'Ej: Nueva Ubicación del Centro',
        description: 'Información importante para la comunidad...',
        category: 'Ej: Novedades'
      },
      'special-offer': {
        title: 'Ej: 3x2 en Sesiones de Aromaterapia',
        description: 'Detalles de la promoción, validez...',
        category: 'Ej: Promociones'
      }
    };
    return placeholders[type as keyof typeof placeholders]?.[field as keyof (typeof placeholders)['service']] || '';
  };

  const addTag = () => {
    if (formState.tagInput.trim() && !formState.tags.includes(formState.tagInput.trim())) {
      setFormState(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const removeTag = (index: number) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formState.title.trim() || !formState.description.trim()) {
      Alert.alert('Error', 'Por favor completa el título y la descripción');
      return;
    }

    // Validate external link
    if (formState.actionButton.action === 'external-link' && !formState.actionButton.url?.trim()) {
      Alert.alert('Error', 'Por favor añade la URL para el enlace externo');
      return;
    }

    const itemData = {
      type: formState.type,
      title: formState.title.trim(),
      description: formState.description.trim(),
      image: formState.image || undefined,
      price: formState.showPrice ? formState.price : undefined,
      currency: formState.showPrice ? formState.currency : undefined,
      category: formState.category.trim() || undefined,
      tags: formState.tags || [],
      priority: formState.priority,
      isActive: formState.isActive,
      validUntil: formState.validUntil || undefined,
      actionButton: formState.actionButton,
      availability: formState.showAvailability ? formState.availability : undefined,
      // Add type-specific fields
      eventDate: formState.eventDate || undefined,
      eventTime: formState.eventTime || undefined,
      location: formState.location || undefined,
      duration: formState.duration || undefined,
      maxParticipants: formState.maxParticipants || undefined,
      // Add service scheduling fields
      isScheduled: formState.isScheduled,
      startDate: formState.startDate || undefined,
      endDate: formState.endDate || undefined,
      schedule: formState.schedule || [],
    };

    onSave(itemData);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {item ? 'Editar Elemento' : 'Nuevo Elemento'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Save size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection - Simplified */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Qué quieres compartir?</Text>
            <View style={styles.simpleTypeGrid}>
              {typeOptions.map((option) => {
                const IconComponent = option.icon;
                                    const isSelected = formState.type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.simpleTypeCard, 
                      isSelected && { ...styles.simpleTypeCardSelected, backgroundColor: option.color }
                    ]}
                    onPress={() => updateField('type', option.value)}
                  >
                    <IconComponent size={24} color={isSelected ? Colors.white : option.color} />
                    <Text style={[styles.simpleTypeText, isSelected && { color: Colors.white }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {formState.type && (
              <View style={styles.typeDescription}>
                <Text style={styles.typeDescriptionText}>
                  {typeOptions.find(opt => opt.value === formState.type)?.description}
                </Text>
              </View>
            )}
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título *</Text>
              <TextInput
                style={styles.input}
                defaultValue={formState.title}
                onChangeText={(text: string) => updateField('title', text)}
                placeholder={getPlaceholderForType(formState.type, 'title')}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                defaultValue={formState.description}
                onChangeText={(text: string) => updateField('description', text)}
                placeholder={getPlaceholderForType(formState.type, 'description')}
                multiline
                numberOfLines={4}
                maxLength={300}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TextInput
                style={styles.input}
                defaultValue={formState.category}
                onChangeText={(text: string) => updateField('category', text)}
                placeholder={getPlaceholderForType(formState.type, 'category')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prioridad (1-10)</Text>
              <TextInput
                style={styles.input}
                defaultValue={formState.priority.toString()}
                onChangeText={(text: string) => updateField('priority', parseInt(text) || 1)}
                placeholder="1"
                keyboardType="numeric"
              />
              <Text style={styles.inputHelper}>Menor número = mayor prioridad en tu tablero</Text>
            </View>
          </View>

          {/* Type-Specific Fields */}
          {(formState.type === 'event' || formState.type === 'service') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {formState.type === 'event' ? 'Detalles del Evento' : 'Detalles del Servicio'}
              </Text>
              
              {formState.type === 'event' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Fecha del Evento</Text>
                    <TextInput
                      style={styles.input}
                      defaultValue={formState.eventDate}
                      onChangeText={(text: string) => updateField('eventDate', text)}
                      placeholder="DD/MM/YYYY"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hora</Text>
                    <TextInput
                      style={styles.input}
                      defaultValue={formState.eventTime}
                      onChangeText={(text: string) => updateField('eventTime', text)}
                      placeholder="Ej: 14:30, 09:00, 20:15"
                    />
                    <Text style={styles.fieldHint}>
                      🕒 Formato: HH:MM (hora en formato 24h)
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {formState.type === 'event' ? 'Ubicación' : 'Modalidad'}
                </Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formState.location}
                  onChangeText={(text: string) => updateField('location', text)}
                  placeholder={formState.type === 'event' ? 'Ej: Casa Lotus, Calle Mayor 15' : 'Ej: Presencial, Online, A domicilio'}
                />
                <Text style={styles.fieldHint}>
                  {formState.type === 'event' 
                    ? '📍 Dirección completa o nombre del lugar' 
                    : '💼 ¿Cómo ofreces tu servicio?'
                  }
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duración</Text>
                <TextInput
                  style={styles.input}
                  defaultValue={formState.duration}
                  onChangeText={(text: string) => updateField('duration', text)}
                  placeholder="Ej: 60 min, 2 horas, medio día, 3 días"
                />
                <Text style={styles.fieldHint}>
                  ⏱️ Sé específico para que sepan qué esperar
                </Text>
              </View>

              {formState.type === 'service' && (
                <>
                  {/* Calendar Integration Toggle */}
                  <View style={styles.inputGroup}>
                    <View style={styles.switchRow}>
                      <View style={styles.switchLabelContainer}>
                        <Text style={styles.switchLabel}>📅 Gestión de Calendario</Text>
                        <Text style={styles.switchSubLabel}>
                          Habilita fechas de disponibilidad y slots de reserva
                        </Text>
                      </View>
                      <Switch
                        value={formState.isScheduled}
                        onValueChange={(value: boolean) => updateField('isScheduled', value)}
                        trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                        thumbColor={formState.isScheduled ? Colors.primary : Colors.text + '60'}
                      />
                    </View>
                  </View>

                  {formState.isScheduled && (
                    <>
                      {/* Date Range */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📅 Rango de Fechas Disponibles</Text>
                        <View style={styles.dateRangeContainer}>
                          <View style={styles.dateInputContainer}>
                            <Text style={styles.dateInputLabel}>Desde</Text>
                            <TextInput
                              style={styles.input}
                              defaultValue={formState.startDate}
                              onChangeText={(text: string) => updateField('startDate', text)}
                              placeholder="YYYY-MM-DD"
                            />
                          </View>
                          <View style={styles.dateInputContainer}>
                            <Text style={styles.dateInputLabel}>Hasta</Text>
                            <TextInput
                              style={styles.input}
                              defaultValue={formState.endDate}
                              onChangeText={(text: string) => updateField('endDate', text)}
                              placeholder="YYYY-MM-DD"
                            />
                          </View>
                        </View>
                        <Text style={styles.fieldHint}>
                          📆 Define el período en que este servicio estará disponible para reservas
                        </Text>
                      </View>

                      {/* Schedule Management */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>🕒 Horarios Disponibles</Text>
                        <Text style={styles.fieldHint}>
                          ⏰ Configura los días y horarios en que ofreces este servicio
                        </Text>
                        
                        {formState.schedule.map((slot: any, index: number) => (
                          <View key={index} style={styles.scheduleSlot}>
                            <Text style={styles.scheduleSlotText}>
                              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][slot.dayOfWeek]} - 
                              {slot.startTime} a {slot.endTime}
                            </Text>
                            <TouchableOpacity 
                              onPress={() => {
                                const newSchedule = [...formState.schedule];
                                newSchedule.splice(index, 1);
                                updateField('schedule', newSchedule);
                              }}
                              style={styles.removeSlotButton}
                            >
                              <Text style={styles.removeSlotText}>❌</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        
                        <TouchableOpacity 
                          style={styles.addSlotButton}
                          onPress={() => setIsSlotModalVisible(true)}
                        >
                          <Text style={styles.addSlotText}>➕ Agregar Horario</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {formState.type === 'event' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Máximo Participantes</Text>
                  <TextInput
                    style={styles.input}
                    defaultValue={formState.maxParticipants.toString()}
                    onChangeText={(text: string) => {
                      const newMax = parseInt(text) || 0;
                      updateField('maxParticipants', newMax);
                      // Sync with availability section
                      if (newMax > 0) {
                        updateField('availability', { 
                          ...formState.availability, 
                          available: Math.min(formState.availability.available || newMax, newMax),
                          total: newMax
                        });
                        updateField('showAvailability', true);
                      }
                    }}
                    placeholder="0 = Sin límite de participantes"
                    keyboardType="numeric"
                  />
                  <Text style={styles.fieldHint}>
                    💡 Define cuántas personas pueden participar máximo
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Pricing Section - Simplified */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precio (Opcional)</Text>
            <Text style={styles.fieldHint}>
              ℹ️ "Sin Precio" oculta el campo de precio en tu publicación
            </Text>
            <View style={styles.priceToggleRow}>
              <TouchableOpacity
                style={[styles.priceToggle, !formState.showPrice && styles.priceToggleActive]}
                onPress={() => updateField('showPrice', false)}
              >
                <Text style={[styles.priceToggleText, !formState.showPrice && styles.priceToggleTextActive]}>
                  Sin Precio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priceToggle, formState.showPrice && styles.priceToggleActive]}
                onPress={() => updateField('showPrice', true)}
              >
                <Text style={[styles.priceToggleText, formState.showPrice && styles.priceToggleTextActive]}>
                  Con Precio
                </Text>
              </TouchableOpacity>
            </View>
            
            {formState.showPrice && (
              <View style={styles.priceInputs}>
                <View style={styles.priceInputRow}>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={formState.price > 0 ? formState.price.toString() : ''}
                    onChangeText={(text: string) => updateField('price', parseFloat(text) || 0)}
                    placeholder="Ej: 25, 50.50, 100"
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencyLabel}>EUR</Text>
                </View>
                <Text style={styles.fieldHint}>
                  💰 Ingresa solo números (decimales con punto: 25.50)
                </Text>
              </View>
            )}
          </View>

          {/* Availability Section - Simplified */}
          {(formState.type === 'service' || formState.type === 'event') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {formState.type === 'event' ? 'Plazas Disponibles (Opcional)' : 'Disponibilidad (Opcional)'}
              </Text>
              <View style={styles.priceToggleRow}>
                <TouchableOpacity
                  style={[styles.priceToggle, !formState.showAvailability && styles.priceToggleActive]}
                  onPress={() => updateField('showAvailability', false)}
                >
                  <Text style={[styles.priceToggleText, !formState.showAvailability && styles.priceToggleTextActive]}>
                    Sin Límite
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceToggle, formState.showAvailability && styles.priceToggleActive]}
                  onPress={() => updateField('showAvailability', true)}
                >
                  <Text style={[styles.priceToggleText, formState.showAvailability && styles.priceToggleTextActive]}>
                    Con Límite
                  </Text>
                </TouchableOpacity>
              </View>
              
              {formState.showAvailability && (
                <View style={styles.priceInputs}>
                  <View style={styles.priceInputRow}>
                    <TextInput
                      style={[styles.input, styles.priceInput]}
                      value={formState.availability.available > 0 ? formState.availability.available.toString() : ''}
                      onChangeText={(text: string) => {
                        const newAvailable = parseInt(text) || 0;
                        const maxLimit = formState.maxParticipants || 999;
                        const actualAvailable = Math.min(newAvailable, maxLimit);
                        
                        updateField('availability', { 
                          ...formState.availability, 
                          available: actualAvailable,
                          total: Math.max(actualAvailable, formState.availability.total)
                        });
                        
                        // Sync back to maxParticipants if it's an event
                        if (formState.type === 'event' && newAvailable > formState.maxParticipants) {
                          updateField('maxParticipants', newAvailable);
                        }
                      }}
                      keyboardType="numeric"
                      placeholder={formState.type === 'event' ? 'Número de plazas disponibles ahora' : 'Cupos disponibles'}
                    />
                    <Text style={styles.currencyLabel}>
                      {formState.type === 'event' ? 'plazas' : 'cupos'}
                    </Text>
                  </View>
                  {formState.type === 'event' && (
                    <Text style={styles.fieldHint}>
                      🔗 Se sincroniza con "Máximo Participantes" (actual: {formState.maxParticipants || 'sin límite'})
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Action Button Section - Simplified */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Qué pueden hacer las personas?</Text>
            <Text style={styles.fieldHint}>
              🎯 Elige la acción principal que quieres que hagan al ver tu publicación
            </Text>
            <View style={styles.actionSimpleGrid}>
              {actionOptions.map((option) => {
                const isSelected = formState.actionButton.action === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.actionSimpleCard, isSelected && styles.actionSimpleCardSelected]}
                    onPress={() => updateField('actionButton', { 
                      ...formState.actionButton, 
                      action: option.value,
                      label: option.label 
                    })}
                  >
                    <Text style={[styles.actionSimpleTitle, isSelected && styles.actionSimpletitleSelected]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.actionSimpleDesc, isSelected && styles.actionSimpleDescSelected]}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formState.actionButton.action === 'external-link' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL del Enlace</Text>
                <TextInput
                  style={styles.input}
                  value={formState.actionButton.url || ''}
                  onChangeText={(text: string) => updateField('actionButton', { ...formState.actionButton, url: text })}
                  placeholder="https://tu-sitio-web.com"
                  keyboardType="url"
                />
              </View>
            )}
          </View>

          {/* Simple Settings Section */}

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            <Text style={styles.fieldHint}>
              💡 Desactivar oculta tu publicación sin eliminarla permanentemente
            </Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {formState.isActive ? '✅ Activo (visible)' : '⏸️ Inactivo (oculto)'}
              </Text>
              <Switch
                value={formState.isActive}
                onValueChange={(value: boolean) => updateField('isActive', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* Slot Selection Modal */}
      <SlotSelectionModal
        visible={isSlotModalVisible}
        onClose={() => setIsSlotModalVisible(false)}
        onSaveSlot={(slot) => {
          updateField('schedule', [...formState.schedule, slot]);
          setIsSlotModalVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  // Simplified Type Selection
  simpleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  simpleTypeCard: {
    flex: 1,
    minWidth: '18%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  simpleTypeCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  simpleTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  typeDescription: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  typeDescriptionText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  
  // Price Toggle Styles
  priceToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  priceToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  priceToggleActive: {
    backgroundColor: Colors.primary,
  },
  priceToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  priceToggleTextActive: {
    color: Colors.white,
  },
  priceInputs: {
    marginTop: 8,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    minWidth: 40,
  },
  
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  availabilityRow: {
    flexDirection: 'row',
  },
  // Simplified Action Buttons
  actionSimpleGrid: {
    gap: 12,
  },
  actionSimpleCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  actionSimpleCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionSimpleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  actionSimpletitleSelected: {
    color: Colors.white,
  },
  actionSimpleDesc: {
    fontSize: 12,
    color: Colors.textLight,
  },
  actionSimpleDescSelected: {
    color: Colors.white,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  // New styles for scheduling
  switchLabelContainer: {
    flex: 1,
  },
  switchSubLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  scheduleSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleSlotText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  removeSlotButton: {
    padding: 4,
  },
  removeSlotText: {
    fontSize: 16,
  },
  addSlotButton: {
    backgroundColor: Colors.primary + '20',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addSlotText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
});
