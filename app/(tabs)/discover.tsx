import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter } from '@/components/SmartIcons';
import { ServiceCard } from '@/components/ServiceCard';
import { LodgingCard } from '@/components/LodgingCard';
import { OfferingCard } from '@/components/OfferingCard';
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
import { ServiceCategory } from '@/types/user';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';

type ViewMode = 'services' | 'lodging' | 'products';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { events, upcomingEvents } = useCalendar();
  const { currentUser } = useUser();
  const { services: allServices, isLoading: isServicesLoading } = useServices();
  const { lodgings: allLodgings, fetchLodgings, isLoading: isLodgingLoading } = useLodging();
  const { products: allProducts, isLoading: isProductsLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('services');

  const isLoading = isServicesLoading || isLodgingLoading || isProductsLoading;

  useEffect(() => {
    fetchLodgings();
  }, [fetchLodgings]);

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
                style={styles.filterButton}
                testID="filter-button"
              >
                <Filter size={20} color={Colors.gold} />
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
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <OnTodayBoard
            events={upcomingEvents.length > 0 ? upcomingEvents : (events || [])}
            onEventPress={() => { }}
          />

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
                  <ServiceCard key={service.id} service={service} onPress={() => { }} />
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
                  <LodgingCard key={lodging.id} lodging={lodging} onPress={() => { }} />
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
