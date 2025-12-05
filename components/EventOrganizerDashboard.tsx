import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';
import { OptimizedImage } from '@/components/OptimizedImage';
import {
  Plus,
  Calendar,
  Users,
  MapPin,
  Clock,
  Settings,
  Send,
  Copy,
  Share2,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Filter,
  Search,
  RefreshCw,
  Globe,
  Lock,
  Star,
  X
} from '@/components/SmartIcons';

// Define missing icons as aliases
const BarChart3 = Settings; // Using Settings as placeholder for BarChart3
const XCircle = X; // Using X as placeholder for XCircle
const TrendingUp = Star; // Using Star as placeholder for TrendingUp
import { TicketGenerator, AttendanceManager } from '@/utils/ticketGenerator';

const { width: screenWidth } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
  category: string;
  image?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  attendeeCount: number;
  revenue: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  duration: number; // hours
  capacity: number;
  price: number;
  category: string;
  requirements: string[];
  usageCount: number;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ticketId: string;
  status: 'registered' | 'checked-in' | 'cancelled' | 'no-show';
  registrationDate: string;
  checkInTime?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

interface EventOrganizerDashboardProps {
  userId: string;
  onEventCreate: (event: Event) => void;
  onEventUpdate: (event: Event) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function EventOrganizerDashboard({ 
  userId, 
  onEventCreate, 
  onEventUpdate, 
  isVisible, 
  onClose 
}: EventOrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'analytics' | 'templates'>('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Event['status']>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Event creation form state
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: 50,
    price: 0,
    category: 'general',
    isPublic: true,
    status: 'draft',
    tags: [],
  });

  const STORAGE_KEY = 'organizer_events';
  const TEMPLATES_KEY = 'event_templates';

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadEvents(),
        loadTemplates(),
        loadDefaultTemplates()
      ]);
    } catch (error) {
      console.error('Error loading organizer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allEvents = stored ? JSON.parse(stored) : [];
      // Filter events created by this user
      const userEvents = allEvents.filter((event: Event) => event.id.startsWith(userId));
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const stored = await AsyncStorage.getItem(TEMPLATES_KEY);
      const allTemplates = stored ? JSON.parse(stored) : [];
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadDefaultTemplates = async () => {
    const defaultTemplates: EventTemplate[] = [
      {
        id: 'workshop',
        name: 'Workshop/Taller',
        description: 'Evento educativo interactivo con capacidad limitada',
        duration: 3,
        capacity: 25,
        price: 50,
        category: 'education',
        requirements: ['Proyector', 'Material didáctico', 'Espacio para grupos'],
        usageCount: 0
      },
      {
        id: 'conference',
        name: 'Conferencia',
        description: 'Presentación formal con audiencia amplia',
        duration: 2,
        capacity: 100,
        price: 75,
        category: 'business',
        requirements: ['Auditorium', 'Sistema de sonido', 'Presentación'],
        usageCount: 0
      },
      {
        id: 'networking',
        name: 'Evento de Networking',
        description: 'Encuentro social para establecer conexiones',
        duration: 4,
        capacity: 60,
        price: 30,
        category: 'social',
        requirements: ['Espacio amplio', 'Catering', 'Área de conversación'],
        usageCount: 0
      },
      {
        id: 'masterclass',
        name: 'Masterclass',
        description: 'Sesión especializada con experto',
        duration: 1.5,
        capacity: 15,
        price: 100,
        category: 'education',
        requirements: ['Espacio íntimo', 'Equipo especializado'],
        usageCount: 0
      }
    ];

    // Merge with existing templates
    const existingTemplates = await AsyncStorage.getItem(TEMPLATES_KEY);
    const existing = existingTemplates ? JSON.parse(existingTemplates) : [];
    
    // Add default templates that don't exist
    const merged = [...existing];
    defaultTemplates.forEach(defaultTemplate => {
      if (!existing.find((t: EventTemplate) => t.id === defaultTemplate.id)) {
        merged.push(defaultTemplate);
      }
    });

    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(merged));
    setTemplates(merged);
  };

  const saveEvent = async (event: Event) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allEvents = stored ? JSON.parse(stored) : [];
      
      const existingIndex = allEvents.findIndex((e: Event) => e.id === event.id);
      if (existingIndex >= 0) {
        allEvents[existingIndex] = event;
      } else {
        allEvents.push(event);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));
      loadEvents(); // Reload to update UI
      return true;
    } catch (error) {
      console.error('Error saving event:', error);
      return false;
    }
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    const event: Event = {
      id: `${userId}_${Date.now()}`,
      title: newEvent.title!,
      description: newEvent.description || '',
      date: newEvent.date!,
      time: newEvent.time!,
      location: newEvent.location!,
      capacity: newEvent.capacity || 50,
      price: newEvent.price || 0,
      category: newEvent.category || 'general',
      status: newEvent.status as Event['status'] || 'draft',
      isPublic: newEvent.isPublic ?? true,
      attendeeCount: 0,
      revenue: 0,
      tags: newEvent.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveEvent(event);
    if (saved) {
      onEventCreate(event);
      setShowCreateModal(false);
      resetNewEvent();
      Alert.alert('Éxito', 'Evento creado exitosamente.');
    } else {
      Alert.alert('Error', 'No se pudo crear el evento.');
    }
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: 50,
      price: 0,
      category: 'general',
      isPublic: true,
      status: 'draft',
      tags: [],
    });
  };

  const useTemplate = (template: EventTemplate) => {
    setNewEvent({
      ...newEvent,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      capacity: template.capacity,
      price: template.price,
      category: template.category,
    });
    
    // Update usage count
    const updatedTemplate = { ...template, usageCount: template.usageCount + 1 };
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? updatedTemplate : t
    );
    setTemplates(updatedTemplates);
    AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updatedTemplates));
    
    setShowCreateModal(true);
  };

  const publishEvent = async (event: Event) => {
    const updatedEvent = { 
      ...event, 
      status: 'published' as Event['status'],
      updatedAt: new Date().toISOString() 
    };
    
    const saved = await saveEvent(updatedEvent);
    if (saved) {
      onEventUpdate(updatedEvent);
      Alert.alert('Éxito', 'Evento publicado exitosamente.');
    }
  };

  const cancelEvent = async (event: Event) => {
    Alert.alert(
      'Confirmar Cancelación',
      '¿Estás seguro de que quieres cancelar este evento?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            const updatedEvent = { 
              ...event, 
              status: 'cancelled' as Event['status'],
              updatedAt: new Date().toISOString() 
            };
            
            const saved = await saveEvent(updatedEvent);
            if (saved) {
              onEventUpdate(updatedEvent);
              Alert.alert('Evento Cancelado', 'El evento ha sido cancelado.');
            }
          }
        }
      ]
    );
  };

  const duplicateEvent = (event: Event) => {
    const duplicated: Event = {
      ...event,
      id: `${userId}_${Date.now()}`,
      title: `${event.title} (Copia)`,
      status: 'draft',
      attendeeCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setNewEvent(duplicated);
    setShowCreateModal(true);
  };

  const shareEvent = (event: Event) => {
    const eventUrl = `https://app.rork.com/events/${event.id}`;
    const shareText = `¡Únete a ${event.title}!\n${event.description}\n📅 ${event.date} ${event.time}\n📍 ${event.location}\n${eventUrl}`;
    
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(shareText);
      Alert.alert('Éxito', 'Enlace copiado al portapapeles.');
    } else {
      // Use Share API on mobile
      Alert.alert('Compartir Evento', shareText);
    }
  };

  const getEventStats = (event: Event) => {
    const attendance = participants.filter(p => p.status === 'checked-in').length;
    const registrations = participants.filter(p => p.status === 'registered').length;
    const revenue = participants.filter(p => p.paymentStatus === 'paid').length * event.price;
    
    return {
      attendance,
      registrations,
      revenue,
      occupancy: (registrations / event.capacity) * 100,
      conversionRate: registrations > 0 ? (attendance / registrations) * 100 : 0
    };
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <TouchableScale style={styles.statCard}>
          <View style={styles.statIcon}>
            <Calendar size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Eventos Totales</Text>
        </TouchableScale>
        
        <TouchableScale style={styles.statCard}>
          <View style={styles.statIcon}>
            <Users size={24} color={Colors.success} />
          </View>
          <Text style={styles.statNumber}>
            {events.reduce((sum, e) => sum + e.attendeeCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Participantes</Text>
        </TouchableScale>
        
        <TouchableScale style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statNumber}>
            ${events.reduce((sum, e) => sum + e.revenue, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </TouchableScale>
        
        <TouchableScale style={styles.statCard}>
          <View style={styles.statIcon}>
            <CheckCircle size={24} color={Colors.info} />
          </View>
          <Text style={styles.statNumber}>
            {events.filter(e => e.status === 'published').length}
          </Text>
          <Text style={styles.statLabel}>Activos</Text>
        </TouchableScale>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableScale 
            style={styles.quickAction}
            onPress={() => {
              onClose();
              router.push('/create-action');
            }}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>Crear Evento</Text>
          </TouchableScale>
          
          <TouchableScale 
            style={styles.quickAction}
            onPress={() => setActiveTab('templates')}
          >
            <Copy size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>Usar Plantilla</Text>
          </TouchableScale>
          
          <TouchableScale 
            style={styles.quickAction}
            onPress={() => setActiveTab('analytics')}
          >
            <BarChart3 size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>Ver Analíticas</Text>
          </TouchableScale>
        </View>
      </View>

      {/* Recent Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eventos Recientes</Text>
        {events.slice(0, 3).map(event => (
          <TouchableScale 
            key={event.id}
            style={styles.eventPreview}
            onPress={() => {
              setSelectedEvent(event);
              setShowEventDetails(true);
            }}
          >
            <View style={styles.eventPreviewInfo}>
              <Text style={styles.eventPreviewTitle}>{event.title}</Text>
              <Text style={styles.eventPreviewDate}>{event.date} • {event.time}</Text>
              <View style={styles.eventPreviewStats}>
                <Text style={styles.eventPreviewStat}>
                  {event.attendeeCount}/{event.capacity} asistentes
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                  <Text style={styles.statusBadgeText}>{getStatusLabel(event.status)}</Text>
                </View>
              </View>
            </View>
          </TouchableScale>
        ))}
      </View>
    </ScrollView>
  );

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            Alert.alert('Filtros', 'Selecciona el estado del evento', [
              { text: 'Todos', onPress: () => setFilterStatus('all') },
              { text: 'Borrador', onPress: () => setFilterStatus('draft') },
              { text: 'Publicado', onPress: () => setFilterStatus('published') },
              { text: 'Cancelado', onPress: () => setFilterStatus('cancelled') },
              { text: 'Completado', onPress: () => setFilterStatus('completed') },
            ]);
          }}
        >
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {filteredEvents.map(event => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventCardHeader}>
              <View style={styles.eventCardInfo}>
                <Text style={styles.eventCardTitle}>{event.title}</Text>
                <Text style={styles.eventCardDate}>{event.date} • {event.time}</Text>
                <Text style={styles.eventCardLocation}>📍 {event.location}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                <Text style={styles.statusBadgeText}>{getStatusLabel(event.status)}</Text>
              </View>
            </View>
            
            <View style={styles.eventCardStats}>
              <View style={styles.eventStat}>
                <Users size={16} color={Colors.textSecondary} />
                <Text style={styles.eventStatText}>
                  {event.attendeeCount}/{event.capacity}
                </Text>
              </View>
              <View style={styles.eventStat}>
                <TrendingUp size={16} color={Colors.textSecondary} />
                <Text style={styles.eventStatText}>${event.revenue}</Text>
              </View>
            </View>
            
            <View style={styles.eventCardActions}>
              <TouchableOpacity 
                style={styles.eventAction}
                onPress={() => {
                  setSelectedEvent(event);
                  setShowEventDetails(true);
                }}
              >
                <Eye size={16} color={Colors.primary} />
                <Text style={styles.eventActionText}>Ver</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.eventAction}
                onPress={() => duplicateEvent(event)}
              >
                <Copy size={16} color={Colors.info} />
                <Text style={styles.eventActionText}>Duplicar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.eventAction}
                onPress={() => shareEvent(event)}
              >
                <Share2 size={16} color={Colors.success} />
                <Text style={styles.eventActionText}>Compartir</Text>
              </TouchableOpacity>
              
              {event.status === 'draft' && (
                <TouchableOpacity 
                  style={styles.eventAction}
                  onPress={() => publishEvent(event)}
                >
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.eventActionText}>Publicar</Text>
                </TouchableOpacity>
              )}
              
              {event.status !== 'cancelled' && (
                <TouchableOpacity 
                  style={styles.eventAction}
                  onPress={() => cancelEvent(event)}
                >
                  <XCircle size={16} color={Colors.error} />
                  <Text style={styles.eventActionText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        {filteredEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No hay eventos</Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery || filterStatus !== 'all' 
                ? 'No se encontraron eventos con los filtros aplicados'
                : 'Crea tu primer evento para comenzar'
              }
            </Text>
            {(!searchQuery && filterStatus === 'all') && (
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Crear Evento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plantillas de Eventos</Text>
        <Text style={styles.sectionSubtitle}>
          Usa estas plantillas para crear eventos rápidamente
        </Text>
        
        {templates.map(template => (
          <TouchableScale 
            key={template.id}
            style={styles.templateCard}
            onPress={() => useTemplate(template)}
          >
            <View style={styles.templateHeader}>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
              </View>
              <View style={styles.templateStats}>
                <Text style={styles.templateUsage}>
                  Usado {template.usageCount} veces
                </Text>
                {template.usageCount > 0 && (
                  <Star size={16} color={Colors.warning} />
                )}
              </View>
            </View>
            
            <View style={styles.templateDetails}>
              <View style={styles.templateDetail}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.templateDetailText}>{template.duration}h</Text>
              </View>
              <View style={styles.templateDetail}>
                <Users size={14} color={Colors.textSecondary} />
                <Text style={styles.templateDetailText}>{template.capacity} personas</Text>
              </View>
              <View style={styles.templateDetail}>
                <TrendingUp size={14} color={Colors.textSecondary} />
                <Text style={styles.templateDetailText}>${template.price}</Text>
              </View>
            </View>
            
            {template.requirements.length > 0 && (
              <View style={styles.templateRequirements}>
                <Text style={styles.templateRequirementsTitle}>Requerimientos:</Text>
                {template.requirements.map((req, index) => (
                  <Text key={index} style={styles.templateRequirement}>
                    • {req}
                  </Text>
                ))}
              </View>
            )}
          </TouchableScale>
        ))}
      </View>
    </ScrollView>
  );

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'draft': return Colors.textSecondary;
      case 'published': return Colors.success;
      case 'cancelled': return Colors.error;
      case 'completed': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Event['status']) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'published': return 'Publicado';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panel de Organizador</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              onClose();
              router.push('/create-action');
            }}
          >
            <Plus size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {[
            { key: 'overview', label: 'Resumen', icon: BarChart3 },
            { key: 'events', label: 'Eventos', icon: Calendar },
            { key: 'templates', label: 'Plantillas', icon: Copy },
          ].map(tab => (
            <TouchableScale
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <tab.icon 
                size={20} 
                color={activeTab === tab.key ? Colors.primary : Colors.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableScale>
          ))}
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'events' && renderEventsTab()}
            {activeTab === 'templates' && renderTemplatesTab()}
          </>
        )}

        {/* Create Event Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Crear Evento</Text>
              <TouchableOpacity onPress={createEvent}>
                <Text style={styles.modalSave}>Guardar</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Título *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEvent.title}
                  onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                  placeholder="Nombre del evento"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Descripción</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                  placeholder="Describe tu evento..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.formLabel}>Fecha *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newEvent.date}
                    onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.formLabel}>Hora *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newEvent.time}
                    onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ubicación *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEvent.location}
                  onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
                  placeholder="Dirección del evento"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.formLabel}>Capacidad</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newEvent.capacity?.toString()}
                    onChangeText={(text) => setNewEvent({ ...newEvent, capacity: parseInt(text) || 0 })}
                    placeholder="50"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.formLabel}>Precio ($)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newEvent.price?.toString()}
                    onChangeText={(text) => setNewEvent({ ...newEvent, price: parseFloat(text) || 0 })}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 10,
    margin: 2,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'column',
    gap: 12,
  },
  quickAction: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  eventPreview: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventPreviewInfo: {
    flex: 1,
  },
  eventPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventPreviewDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  eventPreviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventPreviewStat: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventCardDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventCardLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventCardStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventCardActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  eventAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  eventActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  templateCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateUsage: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  templateDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  templateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  templateRequirements: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  templateRequirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  templateRequirement: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
  },
});