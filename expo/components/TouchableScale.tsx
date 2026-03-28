import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TouchableScaleProps extends TouchableOpacityProps {
  scaleValue?: number;
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export function TouchableScale({ 
  scaleValue = 0.95, 
  hapticFeedback = true, 
  onPress, 
  children, 
  ...props 
}: TouchableScaleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (Platform.OS !== 'web' && hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = (event: any) => {
    if (onPress && event) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.animatedContainer, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
});