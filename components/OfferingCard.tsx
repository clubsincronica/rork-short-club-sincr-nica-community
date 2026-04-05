import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/colors';
import { FloatingCard } from '@/components/FloatingCard';
import { MapPin, Tag, DollarSign } from '@/components/SmartIcons';

interface OfferingCardProps {
  offering: {
    id: string;
    type: 'service' | 'event' | 'product';
    title: string;
    description: string;
    price: number | string;
    image?: string;
    location?: string;
    category?: string;
  };
  onPress: () => void;
}

export function OfferingCard({ offering, onPress }: OfferingCardProps) {
  return (
    <FloatingCard 
      style={styles.floatingContainer} 
      intensity="medium"
    >
      <TouchableOpacity style={styles.container} onPress={onPress} testID={`offering-card-${offering.id}`}>
        {offering.image ? (
          <Image source={{ uri: offering.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
             <Tag size={40} color={Colors.textLight} opacity={0.3} />
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{offering.title}</Text>
            <View style={styles.typeBadge}>
               <Text style={styles.typeText}>
                 {offering.type === 'product' ? 'Producto' : offering.type === 'event' ? 'Evento' : 'Servicio'}
               </Text>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {offering.description}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <DollarSign size={14} color={Colors.gold} />
              <Text style={styles.priceText}>{offering.price}</Text>
            </View>
            
            {offering.location && (
              <View style={styles.locationContainer}>
                <MapPin size={14} color={Colors.textLight} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {offering.location}
                </Text>
              </View>
            )}
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
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});
