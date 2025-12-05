import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter } from '@/components/SmartIcons';
import { ServiceCard } from '@/components/ServiceCard';
import { LodgingCard } from '@/components/LodgingCard';
import { FoodCard } from '@/components/FoodCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { OnTodayBoard } from '@/components/OnTodayBoard';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText, Heading } from '@/components/AccessibleText';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useDebounce } from '@/hooks/useDebounce';
import { mockServices, mockLodging, mockFoodProviders } from '@/mocks/data';
import { ServiceCategory } from '@/types/user';
import { Colors } from '@/constants/colors';
import { useCalendar } from '@/hooks/calendar-store';
import { useUser } from '@/hooks/user-store';

type ViewMode = 'services' | 'lodging' | 'food';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { upcomingEvents } = useCalendar();
  const { currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('services');
  const [isLoading] = useState<boolean>(false);
  
  if (__DEV__) {
    console.log('DiscoverScreen rendered - this should appear in Rork preview');
    console.log('Current user:', currentUser);
    console.log('Upcoming events count:', upcomingEvents.length);
    console.log('Upcoming events:', upcomingEvents);
    console.log('Search query:', searchQuery);
    console.log('Selected category:', selectedCategory);
    console.log('View mode:', viewMode);
  }
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Update mock services with real user data (profile pictures, etc.)
  const servicesWithRealUsers = useMemo(() => {
    if (!currentUser) return mockServices;
    
    return mockServices.map(service => {
      // If the service provider matches the current user or another real user, update their avatar
      if (service.provider.id === currentUser.id || service.provider.email === currentUser.email) {
        return {
          ...service,
          provider: {
            ...service.provider,
            avatar: currentUser.avatar || service.provider.avatar,
            bio: currentUser.bio || service.provider.bio,
            instagram: currentUser.instagram || service.provider.instagram,
            facebook: currentUser.facebook || service.provider.facebook,
            tiktok: currentUser.tiktok || service.provider.tiktok,
          }
        };
      }
      return service;
    });
  }, [currentUser]);

  const filteredServices = useMemo(() => {
    let filtered = servicesWithRealUsers;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }
    
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.provider.name.toLowerCase().includes(query) ||
        service.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [debouncedSearchQuery, selectedCategory, servicesWithRealUsers]);

  const filteredLodging = useMemo(() => {
    let filtered = mockLodging;
    
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(lodging => 
        lodging.title.toLowerCase().includes(query) ||
        lodging.description.toLowerCase().includes(query) ||
        lodging.host.name.toLowerCase().includes(query) ||
        lodging.location.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [debouncedSearchQuery]);

  const filteredFoodProviders = useMemo(() => {
    let filtered = mockFoodProviders;
    
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(provider => 
        provider.businessName.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query) ||
        provider.provider.name.toLowerCase().includes(query) ||
        provider.tags.some(tag => tag.toLowerCase().includes(query)) ||
        provider.cuisine.some(cuisine => cuisine.toLowerCase().includes(query)) ||
        provider.specialties.some(specialty => specialty.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [debouncedSearchQuery]);

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
                accessibilityLabel="Filtros de búsqueda"
                accessibilityHint="Abre las opciones de filtrado"
              >
                <Filter size={20} color={Colors.gold} />
              </TouchableScale>
            </View>
            
            <View style={styles.viewModeContainer}>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'services' && styles.activeViewMode]}
                onPress={() => setViewMode('services')}
                testID="services-tab"
                accessibilityLabel="Ver servicios"
                accessibilityState={{ selected: viewMode === 'services' }}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'services' && styles.activeViewModeText]}>
                  Servicios
                </AccessibleText>
              </TouchableScale>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'lodging' && styles.activeViewMode]}
                onPress={() => setViewMode('lodging')}
                testID="lodging-tab"
                accessibilityLabel="Ver alojamientos"
                accessibilityState={{ selected: viewMode === 'lodging' }}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'lodging' && styles.activeViewModeText]}>
                  Alojamiento
                </AccessibleText>
              </TouchableScale>
              <TouchableScale
                style={[styles.viewModeButton, viewMode === 'food' && styles.activeViewMode]}
                onPress={() => setViewMode('food')}
                testID="food-tab"
                accessibilityLabel="Ver alimentación"
                accessibilityState={{ selected: viewMode === 'food' }}
              >
                <AccessibleText style={[styles.viewModeText, viewMode === 'food' && styles.activeViewModeText]}>
                  Alimentación
                </AccessibleText>
              </TouchableScale>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <OnTodayBoard 
            events={upcomingEvents} 
            onEventPress={() => {}}
          />

          {viewMode === 'services' && (
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          )}

          <View style={styles.resultsContainer}>
            <AccessibleText 
              style={styles.resultsText}
              accessibilityLiveRegion="polite"
            >
              {viewMode === 'services' 
                ? `${filteredServices.length} servicios encontrados`
                : viewMode === 'lodging'
                ? `${filteredLodging.length} lugares encontrados`
                : `${filteredFoodProviders.length} proveedores encontrados`
              }
            </AccessibleText>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} showAvatar={true} lines={3} />
              ))}
            </View>
          ) : viewMode === 'services' ? (
            <View style={styles.servicesContainer}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => {}}
                />
              ))}
            </View>
          ) : viewMode === 'lodging' ? (
            <View style={styles.lodgingContainer}>
              {filteredLodging.map((lodging) => (
                <LodgingCard
                  key={lodging.id}
                  lodging={lodging}
                  onPress={() => {}}
                />
              ))}
            </View>
          ) : (
            <View style={styles.foodContainer}>
              {filteredFoodProviders.map((foodProvider) => (
                <FoodCard
                  key={foodProvider.id}
                  foodProvider={foodProvider}
                  onPress={() => {}}
                />
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
