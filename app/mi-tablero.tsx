import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText, Heading } from '@/components/AccessibleText';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Edit3,
  Plus,
  ArrowLeft,
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Clock
} from '@/components/SmartIcons';
import { useUser } from '@/hooks/user-store';
import { useCalendar } from '@/hooks/calendar-store';
import { useServices } from '@/hooks/services-store';
import { useProducts } from '@/hooks/products-store';
// import { mockServices } from '@/mocks/data';
import { Colors, Gradients } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { ProfilePriorityBoard } from '@/components/ProfilePriorityBoard';
import { PriorityItemManager } from '@/components/PriorityItemManager';
import { ProfilePriorityItem } from '@/types/user';
import { HostAttendanceDashboard } from '@/components/HostAttendanceDashboard';
import { EventOrganizerDashboard } from '@/components/EventOrganizerDashboard';

export default function MiTableroScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, addPriorityItem, updatePriorityItem, removePriorityItem } = useUser();
  const { events, addEvent, updateEvent } = useCalendar();
  const { services, updateService } = useServices();
  const { products, getUserProducts, updateProduct } = useProducts();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isPriorityItemModalVisible, setIsPriorityItemModalVisible] = useState(false);
  const [editingPriorityItem, setEditingPriorityItem] = useState<ProfilePriorityItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
  const [showOrganizerDashboard, setShowOrganizerDashboard] = useState(false);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, you'd refresh all data sources here
    } catch (error) {
      console.error('Error refreshing Mi Tablero:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // One-time cleanup: Remove event-type items from priority board since events are now managed by calendar
  useEffect(() => {
    if (currentUser?.priorityBoard?.length) {
      const eventItems = currentUser.priorityBoard.filter(item => item.type === 'event');
      if (eventItems.length > 0) {
        console.log('🧹 Mi Tablero: Cleaning up', eventItems.length, 'event items from old priority board');
        eventItems.forEach(eventItem => {
          removePriorityItem(eventItem.id);
        });
      }
    }
  }, [currentUser?.id]); // Only run when user changes

  // Create comprehensive offerings from all sources - simplified approach
  const userOfferings = useMemo(() => {
    if (!currentUser) return [];

    console.log('Mi Tablero: Current user:', currentUser.id, currentUser.name);
    // 1. Add services from real services store
    /*
    console.log('Mi Tablero: Total mockServices: 0 (Disabled)');
    console.log('Mi Tablero: Total events:', events.length);
    */

    const offerings: ProfilePriorityItem[] = [];

    // const mockUserServices = mockServices.filter(service => service.providerId === currentUser.id);
    const mockUserServices: any[] = []; // Empty for compatibility
    const realUserServices = services.filter(service => service.providerId === currentUser.id);

    if (__DEV__) {
      console.log('✅ Mi Tablero: Real services found:', realUserServices.length, realUserServices.map(s => s.title));
    }

    // Mock services injection removed
    /*
    mockUserServices.forEach(service => {
       // ...
    });
    */

    // Add real services from services store
    realUserServices.forEach(service => {
      offerings.push({
        id: service.id,
        type: 'service',
        title: service.title,
        description: service.description,
        price: service.price,
        image: service.images?.[0],
        priority: 1,
        isActive: service.isActive !== false, // Default to true if not specified
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        tags: service.tags,
        metadata: {
          duration: service.duration,
          category: service.category,
          isOnline: service.isOnline,
          location: service.location
        }
      });
    });

    // 2. Add ONLY user events from calendar (strict filtering)
    if (__DEV__) {
      console.log('🔍 Mi Tablero: All events:', events.map((e: any) => ({
        id: e.id,
        title: e.title,
        providerId: e.providerId,
        providerIdType: typeof e.providerId,
        providerIdFromObj: e.provider?.id,
        currentUserId: currentUser.id,
        currentUserIdType: typeof currentUser.id
      })));
    }

    const userEvents = events.filter((event: any) => {
      // STRICT FILTERING: Only include events where providerId matches current user AND no provider object exists OR provider.id also matches
      const providerIdMatches = event.providerId === currentUser.id;
      const providerObjMatches = !event.provider || event.provider.id === currentUser.id;
      const isOwner = providerIdMatches && providerObjMatches;

      if (__DEV__) {
        console.log(`🔍 Event "${event.title}": providerId=${event.providerId}, provider.id=${event.provider?.id}, currentUserId=${currentUser.id}, providerIdMatches=${providerIdMatches}, providerObjMatches=${providerObjMatches}, isOwner=${isOwner}`);
      }
      return isOwner;
    });
    if (__DEV__) {
      console.log('✅ Mi Tablero: User events found:', userEvents.length, userEvents.map((e: any) => e.title));
    }

    userEvents.forEach((event: any) => {
      console.log('✅ Mi Tablero: Adding calendar event:', event.title);
      offerings.push({
        id: `event-${event.id}`,
        type: 'event',
        title: event.title,
        description: event.description || '',
        price: event.price || 0,
        image: undefined,
        priority: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        metadata: {
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          maxParticipants: event.maxParticipants,
          currentParticipants: event.currentParticipants,
          isOnline: event.isOnline
        }
      });
    });

    // 3. Add user products from products store
    const realUserProducts = getUserProducts(currentUser.id);
    console.log('Mi Tablero: Real products found:', realUserProducts.length, realUserProducts.map(p => p.title));

    realUserProducts.forEach(product => {
      offerings.push({
        id: product.id,
        type: 'product',
        title: product.title,
        description: product.description,
        price: product.price,
        image: product.images?.[0],
        priority: 1,
        isActive: product.isAvailable,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        tags: product.tags,
        metadata: {
          category: product.category,
          createdAt: product.createdAt
        }
      });
    });

    console.log('Mi Tablero: Total offerings:', offerings.length, offerings.map(o => o.title));

    // Final safety check - ensure all items truly belong to current user
    const safeOfferings = offerings.filter(offering => {
      // Double-check by verifying item source and ownership
      if (offering.type === 'service') {
        // Check if this service ID exists in our filtered services
        const isFromMockServices = mockUserServices.some(s => `mock-service-${s.id}` === offering.id);
        const isFromRealServices = realUserServices.some(s => s.id === offering.id);
        const isValid = isFromMockServices || isFromRealServices;
        if (!isValid) {
          console.warn('⚠️ Mi Tablero: Filtering out unauthorized service:', offering.title, offering.id);
        }
        return isValid;
      }

      if (offering.type === 'event') {
        // Check if this event ID exists in our filtered events
        const isFromUserEvents = userEvents.some((e: any) => `event-${e.id}` === offering.id);
        if (!isFromUserEvents) {
          console.warn('⚠️ Mi Tablero: Filtering out unauthorized event:', offering.title, offering.id);
        }
        return isFromUserEvents;
      }

      if (offering.type === 'product') {
        // Products are already safely filtered via getUserProducts
        return true;
      }

      // Default: allow other types (priority items, etc.)
      return true;
    });

    if (__DEV__) {
      console.log('✅ Mi Tablero: Final safe offerings:', safeOfferings.length, safeOfferings.map(o => o.title));
      console.log('🔍 Mi Tablero: Final offerings breakdown:', safeOfferings.map(o => ({
        id: o.id,
        type: o.type,
        title: o.title,
        source: o.id.startsWith('mock-service-') ? 'mock-service' :
          o.id.startsWith('event-') ? 'event' :
            o.type === 'product' ? 'product' : 'other'
      })));
    }
    // FINAL SECURITY LAYER: Double-check each offering against current user ID
    const ultraSafeOfferings = safeOfferings.filter(offering => {
      if (offering.type === 'service') {
        // For mock services (deprecated), verify the original mock service belongs to current user
        if (offering.id.startsWith('mock-service-')) {
          return false; // No more mock services
        }
        // For real services, verify providerId matches
        const realService = services.find(s => s.id === offering.id);
        return realService && realService.providerId === currentUser.id;
      }

      if (offering.type === 'event') {
        const eventId = offering.id.replace('event-', '');
        const realEvent = events.find((e: any) => e.id === eventId);
        if (!realEvent) return false;

        // Apply same strict filtering as above
        const providerIdMatches = realEvent.providerId === currentUser.id;
        const providerObjMatches = !realEvent.provider || realEvent.provider.id === currentUser.id;
        return providerIdMatches && providerObjMatches;
      }

      // Products are already filtered by getUserProducts
      return true;
    });

    console.log('🔒 Mi Tablero: Ultra-safe final offerings:', ultraSafeOfferings.length, 'vs previous:', safeOfferings.length);
    if (ultraSafeOfferings.length !== safeOfferings.length) {
      console.warn('⚠️ Mi Tablero: Removed', safeOfferings.length - ultraSafeOfferings.length, 'potentially unsafe offerings!');
    }

    return ultraSafeOfferings;
  }, [currentUser, events]);

  // Check if user has hosted events to show attendance dashboard
  const hasHostedEvents = useMemo(() => {
    if (!currentUser) return false;
    return events.some((event: any) => event.providerId === currentUser.id);
  }, [events, currentUser]);

  // Priority Item Handlers
  const handleAddAction = () => {
    // Route to the new unified creation flow
    router.push('/create-action');
  };

  const handleEditPriorityItem = (item: ProfilePriorityItem) => {
    console.log('Mi Tablero: Editing priority item:', item.id, item.title);
    console.log('Mi Tablero: Item type:', item.type);

    // Check if this is a mock item (not editable)
    if (item.id.startsWith('mock-')) {
      Alert.alert(
        'Elemento de demostración',
        'Este es un elemento de demostración y no puede ser editado. Crea tus propios servicios, eventos o productos para editarlos.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to create-action screen with edit parameters
    router.push({
      pathname: '/create-action',
      params: {
        itemId: item.id,
        itemType: item.type
      }
    });
  };

  const handleDeletePriorityItem = (itemId: string) => {
    Alert.alert(
      'Eliminar Elemento',
      '¿Estás seguro de que deseas eliminar este elemento de tu tablero?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removePriorityItem(itemId);
            Alert.alert('Éxito', 'Elemento eliminado de tu tablero');
          },
        },
      ]
    );
  };

  const handleSavePriorityItem = async (itemData: any) => {
    try {
      if (editingPriorityItem) {
        // Check if this is an event that needs to be updated in calendar
        if (editingPriorityItem.id.startsWith('event-')) {
          // Extract the actual event ID
          const eventId = editingPriorityItem.id.replace('event-', '');

          // Update the calendar event
          await updateEvent(eventId, {
            title: itemData.title,
            description: itemData.description,
            location: itemData.location,
            maxParticipants: parseInt(itemData.maxParticipants) || 10,
            price: itemData.price || 0
          });

          console.log('Mi Tablero: Updated calendar event:', eventId);
        }
        // Check if this is a service that needs to be updated in services store
        else if (editingPriorityItem.type === 'service') {
          // For services, use the direct ID (no prefix needed)
          const serviceId = editingPriorityItem.id;

          console.log('Mi Tablero: Attempting to update service:', serviceId, 'with data:', itemData);

          // Update the service including scheduling data
          await updateService(serviceId, {
            title: itemData.title,
            description: itemData.description,
            location: itemData.location,
            duration: itemData.duration,
            price: itemData.price || 0,
            isActive: itemData.isActive,
            // Include scheduling fields
            isScheduled: itemData.isScheduled,
            startDate: itemData.startDate,
            endDate: itemData.endDate,
            schedule: itemData.schedule
          });

          console.log('Mi Tablero: Successfully updated service:', serviceId);
        }
        // Check if this is a product that needs to be updated in products store
        else if (editingPriorityItem.type === 'product') {
          // For products, use the direct ID (no prefix needed)
          const productId = editingPriorityItem.id;

          console.log('Mi Tablero: Attempting to update product:', productId, 'with data:', itemData);

          // Update the product
          await updateProduct(productId, {
            title: itemData.title,
            description: itemData.description,
            price: itemData.price || 0
          });

          console.log('Mi Tablero: Successfully updated product:', productId);
        }

        // Update existing item in priority store
        updatePriorityItem({
          itemId: editingPriorityItem.id,
          updates: itemData
        });
        Alert.alert('Éxito', 'Elemento actualizado en tu tablero');
      } else {
        // Add new item to priority board
        addPriorityItem(itemData);

        // If it's an event, also add it to the calendar
        if (itemData.type === 'event' && itemData.eventDate && currentUser) {
          // Map category to calendar categories
          const categoryMap: { [key: string]: string } = {
            'Talleres': 'yoga',
            'Ceremonias': 'spiritual-guidance',
            'Retiros': 'meditation',
            'Clases Grupales': 'yoga',
            'Conferencias': 'coaching'
          };

          const calendarEvent = {
            providerId: currentUser.id,
            title: itemData.title,
            description: itemData.description,
            category: categoryMap[itemData.category] || 'meditation',
            date: itemData.eventDate,
            startTime: itemData.eventTime || '10:00',
            endTime: calculateEndTime(itemData.eventTime || '10:00', parseInt(itemData.duration) || 60),
            location: itemData.location || 'Por definir',
            isOnline: false,
            maxParticipants: parseInt(itemData.maxParticipants) || 10,
            price: itemData.price || 0,
            tags: itemData.tags || []
          };

          console.log('Mi Tablero: Adding event to calendar:', calendarEvent);
          await addEvent(calendarEvent);
        }

        Alert.alert('Éxito', 'Elemento añadido a tu tablero');
      }
      setIsPriorityItemModalVisible(false);
    } catch (error) {
      console.error('Error saving priority item:', error);
      Alert.alert('Error', 'No se pudo guardar el elemento');
    }
  };

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  };

  const handleItemPress = (item: ProfilePriorityItem) => {
    // Show item details and options
    const itemType = item.type === 'service' ? 'servicio' :
      item.type === 'event' ? 'evento' : 'producto';

    Alert.alert(
      item.title,
      `${item.description}\n\nPrecio: ${item.price}\n\n¿Qué quieres hacer con este ${itemType}?`,
      [
        { text: 'Ver Detalles', onPress: () => showItemDetails(item) },
        { text: 'Editar', onPress: () => handleEditPriorityItem(item) },
        { text: 'Compartir', onPress: () => shareItem(item) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const showItemDetails = (item: ProfilePriorityItem) => {
    let details = `📝 ${item.description}\n\n💰 Precio: ${item.price}`;

    // Type-safe metadata access
    const metadata = (item as any).metadata;
    if (metadata) {
      if (metadata.duration) {
        details += `\n⏱️ Duración: ${metadata.duration} min`;
      }
      if (metadata.location) {
        details += `\n📍 Ubicación: ${metadata.location}`;
      }
      if (metadata.date && metadata.startTime) {
        details += `\n📅 Fecha: ${metadata.date} a las ${metadata.startTime}`;
      }
      if (metadata.maxParticipants) {
        details += `\n👥 Max participantes: ${metadata.maxParticipants}`;
        if (metadata.currentParticipants !== undefined) {
          details += ` (${metadata.currentParticipants} inscritos)`;
        }
      }
    }

    Alert.alert(`Detalles: ${item.title}`, details, [{ text: 'Cerrar' }]);
  };

  const shareItem = (item: ProfilePriorityItem) => {
    const shareText = `¡Echa un vistazo a mi ${item.type}!\n\n${item.title}\n${item.description}\n\nPrecio: ${item.price}`;
    Alert.alert(
      'Compartir',
      shareText + '\n\n(En una app real, esto abriría las opciones de compartir del sistema)',
      [{ text: 'Entendido' }]
    );
  };

  if (!currentUser) {
    return (
      <ConstellationBackground intensity="light">
        <View style={styles.container}>
          <View style={styles.loginPrompt}>
            <Text style={styles.loginTitle}>Inicia sesión para ver tu tablero</Text>
            <TouchableScale
              style={styles.primaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>Volver</Text>
            </TouchableScale>
          </View>
        </View>
      </ConstellationBackground>
    );
  }

  return (
    <ConstellationBackground intensity="light">
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <View style={[styles.headerCard, { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.85)' }]}>
          {/* Title Section */}
          <View style={styles.headerTitleSection}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Mi Tablero</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Publica tus servicios, eventos y productos
            </Text>
          </View>
          {/* Navigation Row - moved below subtitle */}
          <View style={[styles.headerTopRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editModeButton, isEditMode && styles.editModeButtonActive]}
              onPress={() => {
                setIsEditMode(!isEditMode);
              }}
            >
              <Edit3 size={18} color={isEditMode ? Colors.goldDark : Colors.textLight} />
              <Text style={[styles.editModeText, isEditMode && styles.editModeTextActive]}>
                {isEditMode ? '✅ EDITANDO' : '✏️ Editar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Add New Button - Always visible but changes behavior */}
        <TouchableScale
          style={styles.addNewButton}
          onPress={handleAddAction}
        >
          <View style={styles.addNewContent}>
            <View style={styles.addNewIconContainer}>
              <Plus size={24} color={Colors.gold} />
            </View>
            <View style={styles.addNewTextContainer}>
              <Text style={styles.addNewText}>
                {isEditMode ? 'Añadir Elemento' : 'Crear Servicio o Evento'}
              </Text>
              <Text style={styles.addNewSubtext}>
                {isEditMode ? 'Servicios, eventos o productos' : 'Comparte tu talento con la comunidad'}
              </Text>
            </View>
          </View>
        </TouchableScale>

        {/* Interactive Priority Board */}
        <View style={styles.boardSection}>
          <View style={styles.boardHeader}>
            <Text style={styles.boardTitle}>
              Mi Tablero ({userOfferings.length} elementos)
            </Text>
            <Text style={styles.boardSubtitle}>
              {isEditMode ? 'Toca un elemento para editarlo' : 'Toca un elemento para ver más opciones'}
            </Text>
          </View>

          <ProfilePriorityBoard
            items={userOfferings}
            customization={{
              theme: 'colorful',
              showBio: false,
              showSpecialties: false,
              showInterests: false,
              showRating: false,
              showLocation: false,
              showPriorityBoard: true,
              priorityBoardTitle: 'Mi Tablero',
              maxPriorityItems: 20
            }}
            isEditing={isEditMode}
            isOwnProfile={true}
            onEditItem={handleEditPriorityItem}
            onDeleteItem={handleDeletePriorityItem}
            onItemPress={handleItemPress}
          />
        </View>

        {/* Profile Preview - Only show when not in edit mode */}
        {!isEditMode && (
          <View style={styles.profilePreviewSection}>
            <TouchableScale
              style={styles.profilePreviewCard}
              onPress={() => {
                router.push({
                  pathname: '/user-profile',
                  params: {
                    userId: currentUser.id,
                    userName: currentUser.name,
                    userEmail: currentUser.email,
                    userAvatar: currentUser.avatar || '',
                    userBio: currentUser.bio || '',
                    userLocation: currentUser.location || '',
                    userSpecialties: JSON.stringify(currentUser.specialties || []),
                    userRating: currentUser.rating?.toString() || '0',
                    isOwnProfile: 'true',
                    userReviewCount: currentUser.reviewCount?.toString() || '0'
                  }
                });
              }}
            >
              <Users size={24} color={Colors.primary} />
              <View style={styles.profilePreviewTextContainer}>
                <Text style={styles.profilePreviewText}>Vista Previa del Perfil</Text>
                <Text style={styles.profilePreviewSubtext}>Ver cómo otros ven tu perfil público</Text>
              </View>
            </TouchableScale>
          </View>
        )}
      </ScrollView>

      {/* Priority Item Modal */}
      <PriorityItemManager
        visible={isPriorityItemModalVisible}
        item={editingPriorityItem}
        onClose={() => setIsPriorityItemModalVisible(false)}
        onSave={handleSavePriorityItem}
      />

      {/* Host Attendance Dashboard */}
      <HostAttendanceDashboard
        visible={showAttendanceDashboard}
        onClose={() => setShowAttendanceDashboard(false)}
      />

      {/* Event Organizer Dashboard */}
      <EventOrganizerDashboard
        isVisible={showOrganizerDashboard}
        onClose={() => setShowOrganizerDashboard(false)}
        userId={currentUser?.id || 'unknown'}
        onEventCreate={(event) => {
          // Handle event creation
          addEvent({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            category: event.category,
            maxAttendees: event.capacity,
            attendees: [],
            reminders: [],
            isRecurring: false,
            recurrencePattern: 'none',
            status: 'scheduled'
          });
          console.log('Event created:', event);
        }}
        onEventUpdate={(event) => {
          // Handle event updates
          console.log('Event updated:', event);
        }}
      />
    </ConstellationBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Increased bottom padding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textLight,
    marginTop: 4,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  editModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  editModeButtonActive: {
    backgroundColor: Colors.white + 'F0',
    borderWidth: 1,
    borderColor: Colors.goldDark + '60',
  },
  editModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    marginLeft: 6,
  },
  editModeTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  infoAction: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  addNewButton: {
    marginHorizontal: 20,
    marginBottom: 32, // Increased bottom margin for better spacing
    marginTop: 8, // Add top margin
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addNewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  addNewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addNewTextContainer: {
    flex: 1,
  },
  addNewText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  addNewSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  boardSection: {
    paddingHorizontal: 20,
    marginBottom: 40, // Increased spacing
    paddingVertical: 8, // Add vertical padding
  },
  boardHeader: {
    marginBottom: 16,
  },
  boardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  boardSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    width: '22%',
    backgroundColor: Colors.white + '60',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 2,
  },
  statIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statPercentage: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
  },
  quickActionsContainer: {
    marginTop: 24,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.white + '80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  createActionCard: {
    backgroundColor: Colors.primary,
    minHeight: 80,
    justifyContent: 'center',
  },
  createActionText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  createActionSubtext: {
    color: Colors.white + 'CC',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionSubtext: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  profilePreviewContainer: {
    marginTop: 20,
  },
  profilePreviewCard: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '60',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  profilePreviewSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  profilePreviewTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  profilePreviewText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  profilePreviewSubtext: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
    fontWeight: '500',
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  // New header styles for better visual hierarchy
  headerCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  // Improved header layout styles
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },

});