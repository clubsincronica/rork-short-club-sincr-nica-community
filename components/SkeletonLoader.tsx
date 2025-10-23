import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({ showAvatar = true, lines = 3 }: SkeletonCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {showAvatar && (
          <SkeletonLoader width={40} height={40} borderRadius={20} />
        )}
        <View style={styles.cardContent}>
          <SkeletonLoader width="70%" height={16} />
          <SkeletonLoader width="50%" height={12} style={styles.headerSubtitle} />
        </View>
      </View>
      <View style={styles.cardBody}>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLoader
            key={`skeleton-line-${index}`}
            width={index === lines - 1 ? '60%' : '100%'}
            height={12}
            style={styles.bodyLine}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardBody: {
    marginTop: 8,
  },
  headerSubtitle: {
    marginTop: 4,
  },
  bodyLine: {
    marginBottom: 8,
  },
});
