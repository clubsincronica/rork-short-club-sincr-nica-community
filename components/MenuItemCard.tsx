import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Leaf, Flame, AlertCircle } from 'lucide-react-native';
import { MenuItem, FoodProvider } from '@/types/user';
import { Colors } from '@/constants/colors';
import { FloatingCard } from '@/components/FloatingCard';

interface MenuItemCardProps {
  menuItem: MenuItem;
  provider: FoodProvider;
  onPress: () => void;
}

export function MenuItemCard({ menuItem, onPress }: MenuItemCardProps) {
  const getSpicyIndicator = () => {
    if (!menuItem.spicyLevel) return null;
    const flames = [];
    for (let i = 0; i < menuItem.spicyLevel; i++) {
      flames.push(
        <Flame key={i} size={12} color={Colors.error} fill={Colors.error} />
      );
    }
    return flames;
  };

  return (
    <FloatingCard
      style={styles.floatingContainer}
      intensity="subtle"
      enableRotation={false}
      enableShadowAnimation={true}
      delay={Math.random() * 100}
    >
      <TouchableOpacity style={styles.card} onPress={onPress} testID="menu-item-card">
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{menuItem.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {menuItem.description}
          </Text>
          
          <View style={styles.badges}>
            {menuItem.isVegan && (
              <View style={[styles.badge, styles.veganBadge]}>
                <Leaf size={10} color={Colors.white} />
                <Text style={styles.badgeText}>Vegano</Text>
              </View>
            )}
            {menuItem.isGlutenFree && (
              <View style={[styles.badge, styles.glutenFreeBadge]}>
                <Text style={styles.badgeText}>Sin Gluten</Text>
              </View>
            )}
            {menuItem.isOrganic && (
              <View style={[styles.badge, styles.organicBadge]}>
                <Text style={styles.badgeText}>Orgánico</Text>
              </View>
            )}
            {menuItem.spicyLevel && (
              <View style={styles.spicyIndicator}>
                {getSpicyIndicator()}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.price}>${menuItem.price.toFixed(2)}</Text>
            {menuItem.preparationTime && (
              <Text style={styles.prepTime}>{menuItem.preparationTime} min</Text>
            )}
          </View>

          {menuItem.allergens.length > 0 && (
            <View style={styles.allergens}>
              <AlertCircle size={12} color={Colors.warning} />
              <Text style={styles.allergensText} numberOfLines={1}>
                Alérgenos: {menuItem.allergens.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {menuItem.images[0] && (
          <Image source={{ uri: menuItem.images[0] }} style={styles.image} />
        )}
      </View>
    </TouchableOpacity>
    </FloatingCard>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  veganBadge: {
    backgroundColor: '#4CAF50',
  },
  glutenFreeBadge: {
    backgroundColor: '#2196F3',
  },
  organicBadge: {
    backgroundColor: '#8BC34A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  spicyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  prepTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  allergens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  allergensText: {
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});
