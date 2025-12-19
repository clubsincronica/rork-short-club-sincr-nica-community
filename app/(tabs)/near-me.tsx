import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, Users, ShoppingBag, Search } from '@/components/SmartIcons';
import { Colors, Gradients } from '@/constants/colors';
import { User, Service } from '@/types/user';
import { ServiceCard } from '@/components/ServiceCard';
import { getApiBaseUrl } from '@/utils/api-config'; // Ensure we use the correct API URL

type FilterType = 'all' | 'services' | 'users';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface FeedItem {
  id: string;
  type: 'user' | 'service';
  title: string;
  subtitle: string;
  location: string;
  coordinates?: LocationData;
  distance?: number;
  data: User | Service;
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Optional: Get location for distance calculation, but don't block UI
  useEffect(() => {
    const getLocation = async () => {
      try {
        // Simple location attempt - silent fail if not granted
        if (Platform.OS === 'web' && 'geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => console.log('Location access denied or error')
          );
        } else {
          try {
            const Location = await import('expo-location');
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({});
              setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            }
          } catch (e) {
            console.log('Expo location error', e);
          }
        }
      } catch (err) {
        console.log('Location check failed', err);
      }
    };
    getLocation();
  }, []);

  // Fetch ALL users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Use the configured API URL
        const response = await fetch(`${getApiBaseUrl()}/api/users`);
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data);
        } else {
          console.error('Failed to fetch users', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch community users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
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

  const filteredItems = useMemo(() => {
    let items: FeedItem[] = [];

    // 1. Convert users to FeedItems
    if (filter === 'all' || filter === 'users') {
      allUsers.forEach((user) => {
        let distance: number | undefined;
        if (userLocation && user.coordinates?.latitude && user.coordinates?.longitude) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.coordinates.latitude,
            user.coordinates.longitude
          );
        }

        items.push({
          id: `user-${user.id}`,
          type: 'user',
          title: user.name,
          subtitle: user.bio || '',
          location: user.location || '',
          coordinates: user.coordinates,
          distance: distance,
          data: user,
        });
      });
    }

    // 2. Filter by Search Text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(lowerSearch) ||
        item.subtitle.toLowerCase().includes(lowerSearch) ||
        item.location.toLowerCase().includes(lowerSearch)
      );
    }

    // 3. Sort (Optional - maybe by name or distance if available)
    // currently sorting by distance if available, else name
    items.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return a.title.localeCompare(b.title);
    });

    return items;
  }, [allUsers, userLocation, filter, searchText]);

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

  const renderListItem = (item: FeedItem) => {
    if (item.type === 'service') {
      return (
        <ServiceCard
          key={item.id}
          service={item.data as Service}
          onPress={() => { }}
        />
      );
    }

    // User card
    const user = item.data as User;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.userCard}
        onPress={() => router.push({
          pathname: '/user-profile',
          params: {
            userId: user.id,
            userName: user.name,
            userLocation: user.location,
            distance: item.distance?.toFixed(1)
          }
        })}
      >
        <View style={styles.userCardContent}>
          <Image
            source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random` }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userSpecialties} numberOfLines={1}>{user.specialties?.join(', ') || 'Miembro'}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color={Colors.textLight} />
              <Text style={styles.userLocation}>
                {user.location || 'Ubicación no especificada'}
                {item.distance !== undefined && ` • ${item.distance.toFixed(1)} km`}
              </Text>
            </View>
          </View>
          <View style={styles.userRating}>
            {/* Use conditional rendering in case rating is missing */}
            <Text style={styles.ratingText}>⭐ {user.rating || '-'}</Text>
            <Text style={styles.reviewCount}>({user.reviewCount || 0})</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={Gradients.primary || ['#4f8497', '#549ab4']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Comunidad</Text>
          <Text style={styles.subtitle}>Conecta con todos los miembros</Text>

          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar personas o servicios..."
              placeholderTextColor={Colors.textLight}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {renderFilterButton('all', 'Todos', Navigation)}
          {renderFilterButton('services', 'Servicios', ShoppingBag)}
          {renderFilterButton('users', 'Personas', Users)}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando comunidad...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.listContent}>
              {filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={Colors.textLight} />
                  <Text style={styles.emptyStateText}>No se encontraron resultados</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Prueba con otra búsqueda o filtro
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.resultsCount}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'miembro' : 'miembros'}
                  </Text>
                  {filteredItems.map(renderListItem)}
                </>
              )}
            </View>
          </View>
        )}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filtersSection: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
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
    fontWeight: '600',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  listContainer: {
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
    gap: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
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
});

