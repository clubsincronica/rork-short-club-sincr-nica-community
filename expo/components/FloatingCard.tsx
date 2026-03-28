import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '@/constants/colors';

interface FloatingCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'subtle' | 'medium' | 'strong';
  glowColor?: string;
}

export function FloatingCard({ 
  children, 
  style, 
  intensity = 'medium', 
  glowColor
}: FloatingCardProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Static shadow layers for depth */}
      <View style={styles.shadowLayer1} />
      <View style={styles.shadowLayer2} />

      {/* Static glow effect */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={glowColor ? [glowColor, 'transparent'] : Gradients.glow}
          style={styles.glow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Main floating card */}
      <View style={styles.card}>
        <LinearGradient
          colors={Gradients.floating}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardInner}>
            {/* Subtle inner shadow for depth */}
            <View style={styles.innerShadow} />
            {children}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadowLayer1: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 20,
    transform: [{ scaleX: 0.95 }, { scaleY: 0.9 }],
  },
  shadowLayer2: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    bottom: -12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 24,
    transform: [{ scaleX: 0.9 }, { scaleY: 0.85 }],
  },
  glowContainer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 36,
    opacity: 0.15,
  },
  glow: {
    flex: 1,
    borderRadius: 36,
  },
  card: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowRadius: 20,
    shadowOpacity: 0.25,
    elevation: 16,
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.98)',
      android: 'rgba(255, 255, 255, 0.98)',
      default: '#ffffff',
    }),
  },
  cardGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardInner: {
    position: 'relative',
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
});