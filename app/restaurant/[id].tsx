import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Star, ShoppingCart, Truck, ShoppingBag } from '../../components/SmartIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { Colors, Gradients } from '@/constants/colors';
import { mockFoodProviders } from '@/mocks/data';
import { mockMenuItems } from '@/mocks/menu-data';
import { MenuItem, MenuCategory } from '@/types/user';
import { useFoodCart } from '@/hooks/food-cart-store';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Stack } from 'expo-router';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, cartItemsCount } = useFoodCart();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');

  const provider = mockFoodProviders.find(p => p.id === id);
  const menuItems = mockMenuItems.filter(item => item.providerId === id);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<MenuCategory>();
    menuItems.forEach(item => uniqueCategories.add(item.category));
    
    const categoryLabels: Record<MenuCategory, string> = {
      'appetizers': 'Entradas',
      'salads': 'Ensaladas',
      'soups': 'Sopas',
      'main-courses': 'Platos Principales',
      'desserts': 'Postres',
      'beverages': 'Bebidas',
      'smoothies': 'Smoothies',
      'juices': 'Jugos',
      'breakfast': 'Desayuno',
      'snacks': 'Snacks'
    };

    return [
      { key: 'all' as const, label: 'Todo el Menú' },
      ...Array.from(uniqueCategories).map(cat => ({
        key: cat,
        label: categoryLabels[cat]
      }))
    ];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const groupedItems = useMemo(() => {
    const groups: Record<MenuCategory, MenuItem[]> = {} as any;
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }}
      />
      <ConstellationBackground intensity="light">
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[1]}
          >
            {/* Restaurant Header */}
            <View style={styles.header}>
              <Image source={{ uri: provider.images[0] }} style={styles.headerImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.headerGradient}
              />
              
              <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={24} color={Colors.white} />
                </TouchableOpacity>
                
                {cartItemsCount > 0 && (
                  <TouchableOpacity 
                    style={styles.cartButton}
                    onPress={() => router.push('/cart')}
                  >
                    <ShoppingCart size={24} color={Colors.white} />
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.restaurantName}>{provider.businessName}</Text>
                <Text style={styles.restaurantDescription}>{provider.description}</Text>
                
                <View style={styles.restaurantMeta}>
                  <View style={styles.metaItem}>
                    <Star size={16} color={Colors.gold} fill={Colors.gold} />
                    <Text style={styles.metaText}>{provider.rating}</Text>
                    <Text style={styles.metaSubtext}>({provider.reviewCount})</Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Clock size={16} color={Colors.white} />
                    <Text style={styles.metaText}>20-30 min</Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <MapPin size={16} color={Colors.white} />
                    <Text style={styles.metaText}>{provider.location}</Text>
                  </View>
                </View>

                <View style={styles.deliveryOptions}>
                  {provider.isDeliveryAvailable && (
                    <View style={styles.deliveryBadge}>
                      <Truck size={14} color={Colors.white} />
                      <Text style={styles.deliveryText}>Delivery</Text>
                    </View>
                  )}
                  {provider.isPickupAvailable && (
                    <View style={styles.deliveryBadge}>
                      <ShoppingBag size={14} color={Colors.white} />
                      <Text style={styles.deliveryText}>Pickup</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.categoriesWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.key && styles.activeCategoryButton
                    ]}
                    onPress={() => setSelectedCategory(category.key)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === category.key && styles.activeCategoryButtonText
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Menu Items */}
            <LinearGradient colors={Gradients.darkToLight} style={styles.menuContent}>
              {Object.entries(groupedItems).map(([category, items]) => {
                const categoryLabels: Record<string, string> = {
                  'appetizers': 'Entradas',
                  'salads': 'Ensaladas',
                  'soups': 'Sopas',
                  'main-courses': 'Platos Principales',
                  'desserts': 'Postres',
                  'beverages': 'Bebidas',
                  'smoothies': 'Smoothies',
                  'juices': 'Jugos',
                  'breakfast': 'Desayuno',
                  'snacks': 'Snacks'
                };

                return (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>
                      {categoryLabels[category] || category}
                    </Text>
                    {items.map(item => (
                      <MenuItemCard
                        key={item.id}
                        menuItem={item}
                        provider={provider}
                        onPress={() => router.push(`/menu-item/${item.id}`)}
                      />
                    ))}
                  </View>
                );
              })}

              {filteredItems.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No hay items en esta categoría</Text>
                  <Text style={styles.emptyDescription}>
                    Explora otras categorías del menú
                  </Text>
                </View>
              )}
            </LinearGradient>
          </ScrollView>
        </View>
      </ConstellationBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  headerInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  restaurantDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  restaurantMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  metaSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  categoriesWrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoriesContainer: {
    paddingVertical: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryButton: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activeCategoryButtonText: {
    color: Colors.text,
    fontWeight: '700',
  },
  menuContent: {
    minHeight: '100%',
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});