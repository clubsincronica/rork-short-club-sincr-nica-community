import React, { useRef, useState } from 'react';
import { View, Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface SwipeableTabsProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  swipeEnabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width
const VELOCITY_THRESHOLD = 0.5;

/**
 * SwipeableTabs - Horizontal swipe navigation between tabs
 * 
 * Features:
 * - Smooth swipe gesture between tabs
 * - Haptic feedback on swipe
 * - Configurable swipe threshold
 * - Spring animation for natural feel
 * 
 * Usage:
 * <SwipeableTabs
 *   currentIndex={activeTabIndex}
 *   onIndexChange={setActiveTabIndex}
 * >
 *   <DiscoverTab />
 *   <NearMeTab />
 *   <MessagesTab />
 * </SwipeableTabs>
 */
export function SwipeableTabs({
  children,
  currentIndex,
  onIndexChange,
  swipeEnabled = true,
}: SwipeableTabsProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);

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
        setSwiping(true);
        // Light haptic feedback when swipe starts
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      onPanResponderMove: (_, gestureState) => {
        // Prevent swiping beyond boundaries
        const { dx } = gestureState;
        const maxIndex = children.length - 1;
        
        // Don't swipe right on first tab, don't swipe left on last tab
        if (
          (currentIndex === 0 && dx > 0) ||
          (currentIndex === maxIndex && dx < 0)
        ) {
          // Resistance at boundaries
          translateX.setValue(dx * 0.2);
        } else {
          translateX.setValue(dx);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        setSwiping(false);
        const { dx, vx } = gestureState;
        const maxIndex = children.length - 1;
        
        let newIndex = currentIndex;

        // Determine if swipe was significant enough
        const swipedRight = dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD;
        const swipedLeft = dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD;

        if (swipedRight && currentIndex > 0) {
          newIndex = currentIndex - 1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (swipedLeft && currentIndex < maxIndex) {
          newIndex = currentIndex + 1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Animate back to position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();

        if (newIndex !== currentIndex) {
          onIndexChange(newIndex);
        }
      },

      onPanResponderTerminate: () => {
        setSwiping(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Calculate transform for current view
  const currentTransform = {
    transform: [
      {
        translateX: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
          extrapolate: 'clamp',
        }),
      },
    ],
    opacity: swiping
      ? translateX.interpolate({
          inputRange: [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
          outputRange: [0.5, 1, 0.5],
          extrapolate: 'clamp',
        })
      : 1,
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.content, currentTransform]}>
        {children[currentIndex]}
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
