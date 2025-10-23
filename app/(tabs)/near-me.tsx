import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation, Users, ShoppingBag, Utensils } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { allMockUsers, mockServices, mockFoodProviders } from '@/mocks/data';
import { User, Service, FoodProvider } from '@/types/user';
import { ServiceCard } from '@/components/ServiceCard';
import { FoodCard } from '@/components/FoodCard';



type FilterType = 'all' | 'services' | 'food' | 'users';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface NearbyItem {
  id: string;
  type: 'user' | 'service' | 'food';
  title: string;
  subtitle: string;
  location: string;
  coordinates: LocationData;
  distance?: number;
  data: User | Service | FoodProvider;
}

export default function NearMeScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('all');
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              setLocationPermission(true);
              setLoading(false);
            },
            () => {
              // Use default location (San Francisco)
              setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
              setLocationPermission(false);
              setLoading(false);
            }
          );
        } else {
          // Fallback location
          setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
          setLocationPermission(false);
          setLoading(false);
        }
      } else {
        // For native platforms, try to use expo-location
        try {
          const Location = await import('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            // Use default location
            setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
            setLocationPermission(false);
            setLoading(false);
            return;
          }

          setLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setLoading(false);
        } catch {
          // Use default location
          setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
          setLocationPermission(false);
          setLoading(false);
        }
      }
    } catch {
      // Use default location
      setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
      setLocationPermission(false);
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const nearbyItems = useMemo(() => {
    if (!userLocation) return [];

    const items: NearbyItem[] = [];

    // Add users if filter allows
    if (filter === 'all' || filter === 'users') {
      allMockUsers.forEach((user) => {
        if (user.coordinates && user.isServiceProvider) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.coordinates.latitude,
            user.coordinates.longitude
          );
          items.push({
            id: `user-${user.id}`,
            type: 'user',
            title: user.name,
            subtitle: user.specialties.join(', '),
            location: user.location || '',
            coordinates: user.coordinates,
            distance,
            data: user,
          });
        }
      });
    }

    // Add services if filter allows
    if (filter === 'all' || filter === 'services') {
      mockServices.forEach((service) => {
        if (service.provider.coordinates && !service.isOnline) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            service.provider.coordinates.latitude,
            service.provider.coordinates.longitude
          );
          items.push({
            id: `service-${service.id}`,
            type: 'service',
            title: service.title,
            subtitle: `${service.provider.name} • ${service.price}`,
            location: service.location || '',
            coordinates: service.provider.coordinates,
            distance,
            data: service,
          });
        }
      });
    }

    // Add food providers if filter allows
    if (filter === 'all' || filter === 'food') {
      mockFoodProviders.forEach((food) => {
        if (food.provider.coordinates) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            food.provider.coordinates.latitude,
            food.provider.coordinates.longitude
          );
          items.push({
            id: `food-${food.id}`,
            type: 'food',
            title: food.businessName,
            subtitle: `${food.cuisine.join(', ')} • ${food.provider.name}`,
            location: food.location,
            coordinates: food.provider.coordinates,
            distance,
            data: food,
          });
        }
      });
    }

    // Sort by distance
    items.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return items;
  }, [userLocation, filter]);

  const renderFilterButton = (filterType: FilterType, label: string, IconComponent: React.ComponentType<{ size: number; color: string }>) => (
    <TouchableOpacity
      key={filterType}
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <View style={styles.filterButtonContent}>
        <IconComponent size={16} color={filter === filterType ? Colors.white : Colors.text} />
        <Text
          style={[
            styles.filterButtonText,
            filter === filterType && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = (item: NearbyItem) => {
    if (item.type === 'service') {
      return (
        <ServiceCard
          key={item.id}
          service={item.data as Service}
          onPress={() => {}}
        />
      );
    }
    
    if (item.type === 'food') {
      return (
        <FoodCard
          key={item.id}
          foodProvider={item.data as FoodProvider}
          onPress={() => {}}
        />
      );
    }

    // User card
    const user = item.data as User;
    return (
      <TouchableOpacity key={item.id} style={styles.userCard}>
        <View style={styles.userCardContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userSpecialties}>{user.specialties.join(', ')}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color={Colors.textLight} />
              <Text style={styles.userLocation}>
                {user.location}
                {item.distance && ` • ${item.distance.toFixed(1)} km`}
              </Text>
            </View>
          </View>
          <View style={styles.userRating}>
            <Text style={styles.ratingText}>⭐ {user.rating}</Text>
            <Text style={styles.reviewCount}>({user.reviewCount})</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Navigation size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Near Me</Text>
        <View style={styles.locationInfo}>
          <MapPin size={16} color={Colors.textLight} />
          <Text style={styles.locationText}>
            {locationPermission ? 'Location active' : 'Approximate location'}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {renderFilterButton('all', 'All', Navigation)}
        {renderFilterButton('services', 'Services', ShoppingBag)}
        {renderFilterButton('food', 'Food', Utensils)}
        {renderFilterButton('users', 'Providers', Users)}
      </ScrollView>

      {/* Content */}
      <View style={styles.listContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.listContent}>
            {nearbyItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Navigation size={48} color={Colors.textLight} />
                <Text style={styles.emptyStateText}>No nearby services found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try changing filters or checking your location
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.resultsCount}>
                  {nearbyItems.length} {nearbyItems.length === 1 ? 'result' : 'results'} found
                </Text>
                {nearbyItems.map(renderListItem)}
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Location permission notice */}
      {!locationPermission && (
        <View style={styles.permissionNotice}>
          <Text style={styles.permissionText}>
            📍 Enable location for more accurate results
          </Text>
          <TouchableOpacity onPress={requestLocationPermission}>
            <Text style={styles.permissionAction}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    fontWeight: '500',
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userSpecialties: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userLocation: {
    fontSize: 12,
    color: Colors.textLight,
  },
  userRating: {
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  permissionNotice: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
    flex: 1,
  },
  permissionAction: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
