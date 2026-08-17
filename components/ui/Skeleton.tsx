import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius } from '@/lib/theme';

const PULSE_DURATION_MS = 700;

export interface SkeletonProps {
  /** Default '100%'. Accepts numbers or percentage strings. */
  width?: DimensionValue | undefined;
  height: number;
  /** Default Radius.md. */
  radius?: number | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Pulsing glass placeholder block (opacity 0.4 → 0.8 loop). */
export function Skeleton({ width = '100%', height, radius = Radius.md, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: PULSE_DURATION_MS }), -1, true);
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius: radius }, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorderDim,
  },
});
