import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Gradients } from '@/constants/colors';

interface ConstellationBackgroundProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
}

export function ConstellationBackground({ children, intensity = 'medium' }: ConstellationBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const twinkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createTwinkleAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(twinkleAnim, {
            toValue: 1,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(twinkleAnim, {
            toValue: 0,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = createTwinkleAnimation();
    animation.start();

    return () => animation.stop();
  }, [twinkleAnim]);

  // Generate star positions based on screen size
  const generateStars = () => {
    const starCount = intensity === 'light' ? 50 : intensity === 'medium' ? 80 : 120;
    const stars = [];
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1, // Larger stars
        opacity: Math.random() * 0.9 + 0.4, // Brighter stars
        twinkleDelay: Math.random() * 2000,
      });
    }
    return stars;
  };

  // Generate constellation connections
  const generateConstellations = () => {
    const constellationCount = intensity === 'light' ? 4 : intensity === 'medium' ? 7 : 12;
    const constellations = [];
    
    for (let i = 0; i < constellationCount; i++) {
      const points = [];
      const pointCount = Math.floor(Math.random() * 4) + 4; // 4-7 points per constellation
      
      // Create a cluster of points
      const centerX = Math.random() * width;
      const centerY = Math.random() * height;
      const radius = 100 + Math.random() * 80; // Larger constellations
      
      for (let j = 0; j < pointCount; j++) {
        const angle = (j / pointCount) * Math.PI * 2 + Math.random() * 0.8;
        const distance = Math.random() * radius;
        points.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
        });
      }
      
      constellations.push({ id: i, points });
    }
    return constellations;
  };

  const stars = generateStars();
  const constellations = generateConstellations();

  const twinkleOpacity = twinkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      {/* Deep space gradient background */}
      <LinearGradient
        colors={Gradients.constellation || ['rgba(44, 109, 133, 0.8)', 'rgba(79, 132, 151, 0.4)', 'rgba(106, 170, 202, 0.2)']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.6, 1]}
      />
      
      {/* Stars and constellations */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <RadialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="40%" stopColor="#E6E6FA" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#8B6BB1" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#6B4C8A" stopOpacity="0.3" />
          </RadialGradient>
          <RadialGradient id="brightStar" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="30%" stopColor="#F0F8FF" stopOpacity="0.9" />
            <Stop offset="60%" stopColor="#9CAF88" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#F5F5DC" stopOpacity="0.4" />
          </RadialGradient>
        </Defs>
        
        {/* Constellation lines */}
        {constellations.map((constellation) => (
          <React.Fragment key={constellation.id}>
            {constellation.points.map((point, index) => {
              if (index === constellation.points.length - 1) return null;
              const nextPoint = constellation.points[index + 1];
              return (
                <Line
                  key={`${constellation.id}-${index}`}
                  x1={point.x}
                  y1={point.y}
                  x2={nextPoint.x}
                  y2={nextPoint.y}
                  stroke="rgba(156, 175, 136, 0.6)"
                  strokeWidth={1}
                  opacity={0.8}
                  strokeDasharray="2,3"
                />
              );
            })}
          </React.Fragment>
        ))}
        
        {/* Stars */}
        {stars.map((star) => (
          <Circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill={star.size > 2.5 ? "url(#brightStar)" : "url(#starGlow)"}
            opacity={star.opacity}
          />
        ))}
        
        {/* Constellation points */}
        {constellations.map((constellation) =>
          constellation.points.map((point, index) => (
            <Circle
              key={`${constellation.id}-point-${index}`}
              cx={point.x}
              cy={point.y}
              r={2}
              fill="url(#brightStar)"
              opacity={0.9}
            />
          ))
        )}
      </Svg>
      
      {/* Twinkling overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: twinkleOpacity,
            backgroundColor: 'rgba(156, 175, 136, 0.08)',
          },
        ]}
      />
      
      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});