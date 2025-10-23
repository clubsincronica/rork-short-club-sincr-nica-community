import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, Clock, Truck, ShoppingBag } from './TempIcons';
import { FoodProvider } from '@/types/user';
import { Colors } from '@/constants/colors';
import { FloatingCard } from '@/components/FloatingCard';

interface FoodCardProps {
  foodProvider: FoodProvider;
  onPress: () => void;
}

export function FoodCard({ foodProvider, onPress }: FoodCardProps) {
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'organic': 'Orgánico',
      'vegan': 'Vegano',
      'vegetarian': 'Vegetariano',
      'raw': 'Crudo',
      'gluten-free': 'Sin Gluten',
      'ayurvedic': 'Ayurvédico',
      'macrobiotic': 'Macrobiótico',
      'superfood': 'Superalimentos',
      'juice-bar': 'Bar de Jugos',
      'healthy-meals': 'Comidas Saludables',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'organic': '#4CAF50',
      'vegan': '#8BC34A',
      'vegetarian': '#CDDC39',
      'raw': '#FF9800',
      'gluten-free': '#2196F3',
      'ayurvedic': '#9C27B0',
      'macrobiotic': '#607D8B',
      'superfood': '#E91E63',
      'juice-bar': '#00BCD4',
      'healthy-meals': '#795548',
    };
    return colors[category] || Colors.primary;
  };

  return (
    <FloatingCard 
      style={styles.floatingContainer}
      intensity="medium"
    >
      <TouchableOpacity style={styles.card} onPress={onPress} testID="food-card">
      <Image source={{ uri: foodProvider.images[0] }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.businessName} numberOfLines={1}>
              {foodProvider.businessName}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(foodProvider.category) }]}>
              <Text style={styles.categoryText}>
                {getCategoryLabel(foodProvider.category)}
              </Text>
            </View>
          </View>
          
          <View style={styles.ratingContainer}>
            <Star size={14} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.rating}>{foodProvider.rating}</Text>
            <Text style={styles.reviewCount}>({foodProvider.reviewCount})</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {foodProvider.description}
        </Text>

        <View style={styles.cuisineContainer}>
          {foodProvider.cuisine.slice(0, 3).map((cuisine, index) => (
            <View key={index} style={styles.cuisineTag}>
              <Text style={styles.cuisineText}>{cuisine}</Text>
            </View>
          ))}
        </View>

        <View style={styles.specialtiesContainer}>
          <Text style={styles.specialtiesLabel}>Especialidades:</Text>
          <Text style={styles.specialties} numberOfLines={1}>
            {foodProvider.specialties.slice(0, 2).join(', ')}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <MapPin size={12} color={Colors.textLight} />
            <Text style={styles.location}>{foodProvider.location}</Text>
          </View>
          
          <View style={styles.deliveryContainer}>
            {foodProvider.isDeliveryAvailable && (
              <View style={styles.deliveryOption}>
                <Truck size={12} color={Colors.success} />
                <Text style={styles.deliveryText}>Delivery</Text>
              </View>
            )}
            {foodProvider.isPickupAvailable && (
              <View style={styles.deliveryOption}>
                <ShoppingBag size={12} color={Colors.primary} />
                <Text style={styles.deliveryText}>Pickup</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.hoursContainer}>
          <Clock size={12} color={Colors.textLight} />
          <Text style={styles.hours}>
            Hoy: {foodProvider.openingHours.monday}
          </Text>
        </View>

        <View style={styles.certificationsContainer}>
          {foodProvider.certifications.slice(0, 2).map((cert, index) => (
            <View key={index} style={styles.certificationBadge}>
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
    </FloatingCard>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textLight,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.8,
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cuisineTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cuisineText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  specialtiesContainer: {
    marginBottom: 8,
  },
  specialtiesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  specialties: {
    fontSize: 14,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  location: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  deliveryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  hours: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  certificationBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  certificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
});
