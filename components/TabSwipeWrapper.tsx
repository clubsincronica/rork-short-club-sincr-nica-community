import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TabSwipeWrapperProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeEnabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width
const VELOCITY_THRESHOLD = 0.5;

/**
 * TabSwipeWrapper - Adds horizontal swipe gesture detection to tab screens
 * 
 * Wrap each tab screen content with this component to enable swipe navigation
 * between tabs. Works alongside the standard tab bar.
 * 
 * Usage in tab screen:
 * <TabSwipeWrapper
 *   onSwipeLeft={() => router.push('/(tabs)/next-tab')}
 *   onSwipeRight={() => router.push('/(tabs)/previous-tab')}
 * >
 *   <YourTabContent />
 * </TabSwipeWrapper>
 */
export function TabSwipeWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeEnabled = true,
}: TabSwipeWrapperProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if horizontal swipe (more horizontal than vertical)
        return (
          swipeEnabled &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        );
      },
      
      onPanResponderGrant: () => {
        // Light haptic feedback when swipe starts
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      onPanResponderMove: (_, gestureState) => {
        // Update position during swipe with resistance
        const { dx } = gestureState;
        translateX.setValue(dx * 0.3); // Reduced to 30% for preview effect
      },

      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        
        // Determine if swipe was significant enough
        const swipedRight = dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD;
        const swipedLeft = dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD;

        // Animate back to position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();

        // Trigger navigation callbacks immediately
        if (swipedRight && onSwipeRight) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeRight();
        } else if (swipedLeft && onSwipeLeft) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeLeft();
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
