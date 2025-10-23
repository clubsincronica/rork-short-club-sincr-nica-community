import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface FlowerOfLifeProps {
  size?: number;
  style?: any;
}

export function FlowerOfLife({ size = 120, style }: FlowerOfLifeProps) {
  const radius = size * 0.06;
  const centerX = size / 2;
  const centerY = size * 0.8; // Move center down so we show upper half
  const containerRadius = size * 0.45; // Outer circle radius
  
  // Calculate positions for upper half of flower of life pattern
  const positions = [
    // Center circle
    { id: 'center', x: centerX, y: centerY },
    // First ring (6 circles around center) - only upper half
    { id: 'top', x: centerX, y: centerY - radius * 2 }, // top
    { id: 'top-right', x: centerX + radius * 1.732, y: centerY - radius }, // top right
    { id: 'top-left', x: centerX - radius * 1.732, y: centerY - radius }, // top left
    { id: 'right', x: centerX + radius * 1.732, y: centerY + radius }, // right
    { id: 'left', x: centerX - radius * 1.732, y: centerY + radius }, // left
    // Second ring - only upper portion
    { id: 'outer-top', x: centerX, y: centerY - radius * 4 }, // top center
    { id: 'outer-top-right', x: centerX + radius * 3, y: centerY - radius * 2 }, // upper right
    { id: 'outer-top-left', x: centerX - radius * 3, y: centerY - radius * 2 }, // upper left
    { id: 'outer-right', x: centerX + radius * 3.464, y: centerY + radius }, // far right
    { id: 'outer-left', x: centerX - radius * 3.464, y: centerY + radius }, // far left
  ];

  // Filter to show only upper half (above the horizontal line through center)
  const upperHalfPositions = positions.filter(pos => pos.y <= centerY + radius * 0.5);

  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <Defs>
          <LinearGradient id="flowerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9CAF88" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#F5F5DC" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#9CAF88" stopOpacity="0.7" />
          </LinearGradient>
          <LinearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9CAF88" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#F5F5DC" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9CAF88" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        
        {/* Outer containing circle - upper half only */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={containerRadius}
          fill="none"
          stroke="url(#flowerGradient)"
          strokeWidth={2}
          opacity={0.8}
          clipPath="polygon(0 0, 100% 0, 100% 50%, 0 50%)"
        />
        
        {/* Flower of Life pattern - upper half */}
        {upperHalfPositions.map((pos) => (
          <Circle
            key={pos.id}
            cx={pos.x}
            cy={pos.y}
            r={radius}
            fill="none"
            stroke="url(#flowerGradient)"
            strokeWidth={1.5}
            opacity={0.8}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
