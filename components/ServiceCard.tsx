import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, Clock, Wifi, WifiOff } from '@/components/SmartIcons';
import { Service } from '@/types/user';
import { Colors } from '@/constants/colors';
import { FloatingCard } from '@/components/FloatingCard';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  return (
    <FloatingCard 
      style={styles.floatingContainer} 
      intensity="medium"
    >
      <TouchableOpacity style={styles.container} onPress={onPress} testID="service-card">
        <Image source={{ uri: service.images[0] }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{service.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${service.price}</Text>
            </View>
          </View>
          
          <View style={styles.providerInfo}>
            <Image source={{ uri: service.provider.avatar }} style={styles.avatar} />
            <Text style={styles.providerName}>{service.provider.name}</Text>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {service.description}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.rating}>
              <Star size={14} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingText}>{service.rating}</Text>
              <Text style={styles.reviewCount}>({service.reviewCount})</Text>
            </View>
            
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Clock size={12} color={Colors.textLight} />
                <Text style={styles.detailText}>{service.duration}min</Text>
              </View>
              
              <View style={styles.detailItem}>
                {service.isOnline ? (
                  <Wifi size={12} color={Colors.success} />
                ) : (
                  <WifiOff size={12} color={Colors.textLight} />
                )}
                <Text style={styles.detailText}>
                  {service.isOnline ? 'En línea' : 'Presencial'}
                </Text>
              </View>
              
              {service.location && (
                <View style={styles.detailItem}>
                  <MapPin size={12} color={Colors.textLight} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {service.location}
                  </Text>
                </View>
              )}
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
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  providerInfo: {
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
  providerName: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
