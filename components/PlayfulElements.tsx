import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Text, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

/**
 * FloatingActionButton - Playful FAB with micro-animations
 * Bounces gently to catch attention without being annoying
 */
interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  label?: string;
}

export function FloatingActionButton({ onPress, icon, label }: FloatingActionButtonProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle bounce animation that loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    // Quick scale feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          transform: [{ translateY: bounceAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View style={styles.fabButton} onTouchEnd={handlePress}>
        {icon}
        {label && <Text style={styles.fabLabel}>{label}</Text>}
      </Animated.View>
    </Animated.View>
  );
}

/**
 * PulsingDot - Attention-grabbing indicator
 * Used for notifications or new content
 */
interface PulsingDotProps {
  color?: string;
  size?: number;
}

export function PulsingDot({ color = Colors.primary, size = 12 }: PulsingDotProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.dotContainer, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}

/**
 * ShimmerEffect - Loading state that feels alive
 * More engaging than static skeleton loaders
 */
interface ShimmerEffectProps {
  width: number;
  height: number;
  borderRadius?: number;
}

export function ShimmerEffect({ width, height, borderRadius = 8 }: ShimmerEffectProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.shimmerContainer, { width, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.shimmerGradient,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * SuccessAnimation - Celebration micro-animation
 * Makes completing actions feel rewarding
 */
interface SuccessAnimationProps {
  onComplete?: () => void;
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.successContainer,
        {
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.successIcon}>✨</Text>
    </Animated.View>
  );
}

/**
 * SwipeHint - Subtle animation showing swipe is possible
 * Appears briefly to teach gesture interaction
 */
interface SwipeHintProps {
  direction?: 'left' | 'right';
  onDismiss?: () => void;
}

export function SwipeHint({ direction = 'left', onDismiss }: SwipeHintProps) {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = direction === 'left' ? -30 : 30;

    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateAnim, {
            toValue: distance,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.swipeHint,
        {
          transform: [{ translateX: translateAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.swipeHintText}>
        {direction === 'left' ? '← Desliza' : 'Desliza →'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: Colors.text,
    fontWeight: '600',
  },
  dotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    // Dynamic styles applied inline
  },
  shimmerContainer: {
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  successContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  swipeHintText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
