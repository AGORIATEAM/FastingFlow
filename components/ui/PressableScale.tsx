import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import type {
  AccessibilityRole,
  AccessibilityState,
  Insets,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';

export type HapticType = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'none';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 20, stiffness: 300 } as const;
const PRESSED_SCALE = 0.97;

function triggerHaptic(type: HapticType): void {
  switch (type) {
    case 'selection':
      haptics.selection();
      break;
    case 'light':
      haptics.light();
      break;
    case 'medium':
      haptics.medium();
      break;
    case 'success':
      haptics.success();
      break;
    case 'warning':
      haptics.warning();
      break;
    case 'none':
      break;
  }
}

export interface PressableScaleProps {
  onPress?: (() => void) | undefined;
  disabled?: boolean | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  children: ReactNode;
  /** Haptic fired on press, before the onPress callback. Default 'none'. */
  haptic?: HapticType | undefined;
  accessibilityLabel?: string | undefined;
  /** Default 'button'. */
  accessibilityRole?: AccessibilityRole | undefined;
  accessibilityState?: AccessibilityState | undefined;
  hitSlop?: number | Insets | undefined;
}

/**
 * Pressable that springs down to 0.97 scale while pressed.
 * Generalizes the StopButton/StartButton press feedback from the home screen.
 */
export function PressableScale({
  onPress,
  disabled = false,
  style,
  children,
  haptic = 'none',
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(PRESSED_SCALE, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      onPress={() => {
        triggerHaptic(haptic);
        onPress?.();
      }}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
