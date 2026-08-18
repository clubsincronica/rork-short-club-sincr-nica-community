import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter, Users } from '@/components/SmartIcons';
import { ServiceCard } from '@/components/ServiceCard';
import { LodgingCard } from '@/components/LodgingCard';
import { OfferingCard } from '@/components/OfferingCard';
import { SpaceCard } from '@/components/SpaceCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { OnTodayBoard } from '@/components/OnTodayBoard';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText, Heading } from '@/components/AccessibleText';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useDebounce } from '@/hooks/useDebounce';
import { useCalendar } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';
import { useServices } from '@/hooks/services-store';
import { useLodging } from '@/hooks/lodging-store';
import { useProducts } from '@/hooks/products-store';
import { useCoWork } from '@/hooks/cowork-store';
import { ServiceCategory, SubSpaceType } from '@/types/user';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';

type ViewMode = 'services' | 'lodging' | 'products' | 'events' | 'spaces';

const SPACE_TYPE_FILTERS: { key: SubSpaceType | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'office', label: 'Oficina' },
  { key: 'studio', label: 'Estudio' },
  { key: 'meeting-room', label: 'Sala de reuniones' },
  { key: 'event-space', label: 'Evento' },
  { key: 'streaming-set', label: 'Streaming' },
  { key: 'recording-booth', label: 'Cabina de grabación' },
  { key: 'coworking-desk', label: 'Escritorio' },
  { key: 'other', label: 'Otros' },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { events, upcomingEvents } = useCalendar();
  const { currentUser } = useUser();
  const { services: allServices, isLoading: isServicesLoading } = useServices();
  const { lodgings: allLodgings, fetchLodgings, isLoading: isLodgingLoading } = useLodging();
  const { products: allProducts, isLoading: isProductsLoading } = useProducts();
  const { spaces: allSpaces, loadData: loadCoWork } = useCoWork();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('services');
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<SubSpaceType | 'all'>('all');
  const [spaceCapacity, setSpaceCapacity] = useState<string>('');
  const [spaceMaxPrice, setSpaceMaxPrice] = useState<string>('');
  const [spaceInstantBookOnly, setSpaceInstantBookOnly] = useState(false);

  const isLoading = isServicesLoading || isLodgingLoading || isProductsLoading || isLoadingSpaces;

  useEffect(() => {
    fetchLodgings();
  }, [fetchLodgings]);

  useEffect(() => {
    setIsLoadingSpaces(true);
    loadCoWork().finally(() => setIsLoadingSpaces(false));
  }, [loadCoWork]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredServices = useMemo(() => {
    let filtered = allServices as any[];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((service: any) => service.category === selectedCategory);
    }
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((service: any) =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        (service.tags && service.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      );
    }
    return filtered;
  }, [debouncedSearchQuery, selectedCategory, allServices]);

  const filteredLodging = useMemo(() => {
    let filtered = allLodgings as any[];
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((lodging: any) =>
        lodging.title.toLowerCase().includes(query) ||
        lodging.description.toLowerCase().includes(query) ||
        lodging.location.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [debouncedSearchQuery, allLodgings]);

  const filteredEvents = useMemo(() => {
    let filtered = (events || []) as any[];
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((event: any) =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [debouncedSearchQuery, events]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts as any[];
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((product: any) =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [debouncedSearchQuery, allProducts]);

  const minActiveHourlyPrice = (subSpaces: any[]): number | null => {
    const prices = (subSpaces ?? [])
      .filter((sub: any) => sub.isActive && typeof sub.pricePerHour === 'number' && sub.pricePerHour > 0)
      .map((sub: any) => sub.pricePerHour as number);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  const filteredSpaces = useMemo(() => {
    let filtered = (allSpaces as any[]).filter((space: any) => space.isPublished !== false);

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((space: any) =>
        space.title.toLowerCase().includes(query) ||
        space.description.toLowerCase().includes(query) ||
        space.location?.toLowerCase().includes(query)
      );
    }

    if (spaceTypeFilter !== 'all') {
      filtered = filtered.filter((space: any) =>
        (space.subSpaces ?? []).some((sub: any) => sub.type === spaceTypeFilter)
      );
    }

    const capacity = parseInt(spaceCapacity, 10);
    if (!Number.isNaN(capacity) && capacity > 0) {
      filtered = filtered.filter((space: any) => {
        const subs = (space.subSpaces ?? []) as any[];
        if (subs.length === 0) return true;
        return subs.some((sub: any) => sub.isActive && sub.capacity >= capacity);
      });
    }

    const maxPrice = parseFloat(spaceMaxPrice);
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      filtered = filtered.filter((space: any) => {
        const from = minActiveHourlyPrice(space.subSpaces ?? []);
        return from == null || from <= maxPrice;
      });
    }

    if (spaceInstantBookOnly) {
      // The flat /api/spaces list does not return instant_book at space-level, so
      // this filter only applies when nested sub-spaces are present (cached/demo
      // data or after the Task 10 detail fetch). Spaces without sub-spaces pass.
      filtered = filtered.filter((space: any) => {
        const subs = (space.subSpaces ?? []) as any[];
        if (subs.length === 0) return true;
        return subs.some((sub: any) => sub.isActive && !!sub.instantBook);
      });
    }

    return filtered;
  }, [
    allSpaces,
    debouncedSearchQuery,
    spaceTypeFilter,
    spaceCapacity,
    spaceMaxPrice,
    spaceInstantBookOnly,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greeting}>
              <AccessibleText style={styles.welcomeText}>Hola, bienvenido</AccessibleText>
              <Heading level={1} style={styles.titleText}>Club Sincrónica</Heading>
              <AccessibleText style={styles.subtitleText}>Encuentra tu bienestar</AccessibleText>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar servicios, practicantes o lugares..."
                  placeholderTextColor={Colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  testID="search-input"
                />
              </View>
              <TouchableScale
                style={[styles.filterButton, viewMode === 'spaces' && isFiltersVisible && styles.activeFilterButton]}
                onPress={() => setIsFiltersVisible(viewMode === 'spaces' ? !isFiltersVisible : false)}
                testID="filter-button"
              >
                <Filter size={20} color={viewMode === 'spaces' && isFiltersVisible ? Colors.textOnGold : Colors.gold} />
              </TouchableScale>
            </View>

            <View style={styles.viewModeContainer}>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'services' && styles.activeViewMode]}
                onPress={() => setViewMode('services')}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'services' && styles.activeViewModeText]}>
                  Servicios
                </AccessibleText>
              </TouchableScale>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'lodging' && styles.activeViewMode]}
                onPress={() => setViewMode('lodging')}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'lodging' && styles.activeViewModeText]}>
                  Alojamiento
                </AccessibleText>
              </TouchableScale>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'products' && styles.activeViewMode]}
                onPress={() => setViewMode('products')}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'products' && styles.activeViewModeText]}>
                  Productos
                </AccessibleText>
              </TouchableScale>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'events' && styles.activeViewMode]}
                onPress={() => setViewMode('events')}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'events' && styles.activeViewModeText]}>
                  Eventos
                </AccessibleText>
              </TouchableScale>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'spaces' && styles.activeViewMode]}
                onPress={() => setViewMode('spaces')}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'spaces' && styles.activeViewModeText]}>
                  Espacios
                </AccessibleText>
              </TouchableScale>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <OnTodayBoard
            events={upcomingEvents.length > 0 ? upcomingEvents : (events || [])}
            onEventPress={(event) => router.push({
              pathname: '/event-detail',
              params: { eventId: event.id, eventName: event.title }
            })}
          />

          {viewMode === 'spaces' && isFiltersVisible && (
            <View style={styles.spacesFilterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spacesTypeContent}
                keyboardShouldPersistTaps="handled"
              >
                {SPACE_TYPE_FILTERS.map((filter) => {
                  const isSelected = spaceTypeFilter === filter.key;
                  return (
                    <TouchableScale
                      key={filter.key}
                      style={[styles.spaceTypePill, isSelected && styles.spaceTypePillSelected]}
                      onPress={() => setSpaceTypeFilter(filter.key)}
                    >
                      <AccessibleText style={[styles.spaceTypePillText, isSelected && styles.spaceTypePillTextSelected]}>
                        {filter.label}
                      </AccessibleText>
                    </TouchableScale>
                  );
                })}
              </ScrollView>

              <View style={styles.spacesFilterRow}>
                <View style={styles.spaceFilterInputBox}>
                  <Users size={16} color={Colors.textLight} />
                  <TextInput
                    style={styles.spaceFilterInput}
                    placeholder="Capacidad"
                    placeholderTextColor={Colors.textLight}
                    value={spaceCapacity}
                    onChangeText={setSpaceCapacity}
                    keyboardType="number-pad"
                    testID="space-capacity-input"
                  />
                </View>
                <View style={styles.spaceFilterInputBox}>
                  <AccessibleText style={styles.spaceFilterPrefix}>$</AccessibleText>
                  <TextInput
                    style={styles.spaceFilterInput}
                    placeholder="Precio máx/h"
                    placeholderTextColor={Colors.textLight}
                    value={spaceMaxPrice}
                    onChangeText={setSpaceMaxPrice}
                    keyboardType="numbers-and-punctuation"
                    testID="space-maxprice-input"
                  />
                </View>
                <TouchableScale
                  style={[styles.instantBookToggle, spaceInstantBookOnly && styles.instantBookToggleActive]}
                  onPress={() => setSpaceInstantBookOnly((prev) => !prev)}
                  testID="space-instantbook-toggle"
                >
                  <AccessibleText
                    style={[styles.instantBookText, spaceInstantBookOnly && styles.instantBookTextActive]}
                  >
                    Sólo Instant Book
                  </AccessibleText>
                </TouchableScale>
              </View>
            </View>
          )}

          {viewMode === 'services' && (
            <>
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <View style={styles.resultsContainer}>
                <AccessibleText style={styles.resultsText}>
                  {filteredServices.length} servicios encontrados
                </AccessibleText>
              </View>
              <View style={styles.servicesContainer}>
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} onPress={() => router.push({
                    pathname: '/service-detail',
                    params: { serviceId: service.id, serviceName: service.title }
                  })} />
                ))}
              </View>
            </>
          )}

          {viewMode === 'lodging' && (
            <>
              <View style={styles.resultsContainer}>
                <AccessibleText style={styles.resultsText}>
                  {filteredLodging.length} lugares encontrados
                </AccessibleText>
              </View>
              <View style={styles.lodgingContainer}>
                {filteredLodging.map((lodging) => (
                  <LodgingCard key={lodging.id} lodging={lodging} onPress={() => router.push({
                    pathname: '/lodging-detail',
                    params: { lodgingId: lodging.id }
                  })} />
                ))}
              </View>
            </>
          )}

          {viewMode === 'products' && (
            <>
              <View style={styles.resultsContainer}>
                <AccessibleText style={styles.resultsText}>
                  {filteredProducts.length} productos encontrados
                </AccessibleText>
              </View>
              <View style={styles.servicesContainer}>
                {filteredProducts.map((product) => (
                  <OfferingCard
                    key={product.id}
                    offering={{
                      id: product.id,
                      type: 'product',
                      title: product.title,
                      description: product.description,
                      price: product.price,
                      image: product.images?.[0],
                      location: 'Envíos disponibles'
                    }}
                    onPress={() => router.push({
                      pathname: '/product-detail',
                      params: { id: product.id }
                    })}
                  />
                ))}
              </View>
            </>
          )}

          {viewMode === 'events' && (
            <>
              <View style={styles.resultsContainer}>
                <AccessibleText style={styles.resultsText}>
                  {filteredEvents.length} eventos encontrados
                </AccessibleText>
              </View>
              <View style={styles.servicesContainer}>
                {filteredEvents.map((event: any) => (
                  <OfferingCard
                    key={event.id}
                    offering={{
                      id: event.id,
                      type: 'event',
                      title: event.title,
                      description: event.description || '',
                      price: event.price || 0,
                      image: event.images?.[0],
                      location: event.location || ''
                    }}
                    onPress={() => router.push({
                      pathname: '/event-detail',
                      params: { eventId: event.id, eventName: event.title }
                    })}
                  />
                ))}
              </View>
            </>
          )}

          {viewMode === 'spaces' && (
            <>
              <View style={styles.resultsContainer}>
                <AccessibleText style={styles.resultsText}>
                  {filteredSpaces.length} espacios encontrados
                </AccessibleText>
              </View>
              <View style={styles.spacesContainer}>
                {filteredSpaces.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    onPress={() => router.push({
                      pathname: '/cowork-detail',
                      params: { spaceId: space.id }
                    })}
                  />
                ))}
              </View>
            </>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} showAvatar={true} lines={3} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.white,
    paddingBottom: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greeting: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeViewMode: {
    backgroundColor: Colors.gold,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activeViewModeText: {
    color: Colors.textOnGold,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 40,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  servicesContainer: {
    paddingBottom: 20,
  },
  spacesContainer: {
    paddingBottom: 20,
  },
  spacesFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  spacesTypeContent: {
    gap: 8,
    paddingRight: 8,
  },
  spaceTypePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spaceTypePillSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
  },
  spaceTypePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  spaceTypePillTextSelected: {
    color: Colors.textOnGold,
    fontWeight: '700',
  },
  spacesFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  spaceFilterInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spaceFilterInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    minWidth: 60,
  },
  spaceFilterPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  instantBookToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instantBookToggleActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
  },
  instantBookText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  instantBookTextActive: {
    color: Colors.textOnGold,
    fontWeight: '700',
  },
  activeFilterButton: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
  },
  lodgingContainer: {
    paddingBottom: 20,
  },
  foodContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingHorizontal: 20,
  },
});
