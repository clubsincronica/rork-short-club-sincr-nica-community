import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, Users } from '@/components/SmartIcons';
import { Lodging } from '@/types/user';
import { Colors } from '@/constants/colors';
import { FloatingCard } from '@/components/FloatingCard';

interface LodgingCardProps {
  lodging: Lodging;
  onPress: () => void;
}

export function LodgingCard({ lodging, onPress }: LodgingCardProps) {
  return (
    <FloatingCard
      style={styles.floatingContainer}
      intensity="medium"
    >
      <TouchableOpacity style={styles.container} onPress={onPress} testID="lodging-card">
      <Image source={{ uri: lodging.images[0] }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{lodging.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${lodging.pricePerNight}</Text>
            <Text style={styles.priceUnit}>/noche</Text>
          </View>
        </View>
        
        <View style={styles.hostInfo}>
          <Image source={{ uri: lodging.host.avatar }} style={styles.avatar} />
          <Text style={styles.hostName}>Anfitrión: {lodging.host.name}</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {lodging.description}
        </Text>
        
        <View style={styles.amenities}>
          {lodging.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {lodging.amenities.length > 3 && (
            <Text style={styles.moreAmenities}>+{lodging.amenities.length - 3} más</Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Star size={14} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.ratingText}>{lodging.rating}</Text>
            <Text style={styles.reviewCount}>({lodging.reviewCount})</Text>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Users size={12} color={Colors.textLight} />
              <Text style={styles.detailText}>Hasta {lodging.maxGuests} huéspedes</Text>
            </View>
            
            <View style={styles.detailItem}>
              <MapPin size={12} color={Colors.textLight} />
              <Text style={styles.detailText} numberOfLines={1}>
                {lodging.location}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.8,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  amenityTag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  moreAmenities: {
    fontSize: 13,
    color: Colors.textLight,
    alignSelf: 'center',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 2,
  },
  details: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
