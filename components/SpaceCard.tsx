import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MapPin } from '@/components/SmartIcons';
import { CoWorkSpace, SubSpace } from '@/types/user';
import { Colors, Gradients } from '@/constants/colors';
import { FloatingCard } from '@/components/FloatingCard';
import { TouchableScale } from '@/components/TouchableScale';
import { OptimizedImage } from '@/components/OptimizedImage';

interface SpaceCardProps {
  space: CoWorkSpace;
  onPress: () => void;
}

export function minActiveHourlyPrice(subSpaces: SubSpace[]): number | null {
  const prices = subSpaces
    .filter((sub) => sub.isActive && typeof sub.pricePerHour === 'number' && sub.pricePerHour > 0)
    .map((sub) => sub.pricePerHour as number);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function SpaceCard({ space, onPress }: SpaceCardProps) {
  const cover = space?.images?.[0];
  const fromPrice = minActiveHourlyPrice(space?.subSpaces ?? []);

  return (
    <FloatingCard style={styles.floatingContainer} intensity="medium">
      <TouchableScale onPress={onPress} style={styles.container} testID="space-card">
        {cover ? (
          <OptimizedImage uri={cover} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={Gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          >
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderTitle}>Espacio</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {space?.title || 'Espacio sin título'}
            </Text>
            {fromPrice != null && (
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${fromPrice}</Text>
                <Text style={styles.priceUnit}>/h</Text>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <MapPin size={14} color={Colors.textLight} />
            <Text style={styles.detailText} numberOfLines={1}>
              {space?.location || 'Ubicación no disponible'}
            </Text>
          </View>

          {space && space.rating > 0 && (
            <View style={styles.rating}>
              <Star size={14} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.ratingText}>{space.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableScale>
    </FloatingCard>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  container: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
    flexShrink: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 4,
  },
});
