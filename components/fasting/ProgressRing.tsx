import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Defs, LinearGradient, Stop, Svg } from 'react-native-svg';

import { Colors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PROGRESS_ANIM_MS = 1000;

export interface ProgressRingProps {
  /** 0..1 — clamped internally. */
  progress: number;
  /** Outer diameter in px. */
  size: number;
  /** Default 8. */
  strokeWidth?: number | undefined;
  /** Centered content (timer text etc.) — supplied by the parent. */
  children?: ReactNode | undefined;
}

/**
 * Gradient progress ring (cyan → tertiary) extracted from the home screen.
 * Pure rendering: no time logic. The dash offset animates towards each new
 * progress value with a 1s linear timing.
 */
export function ProgressRing({ progress, size, strokeWidth = 8, children }: ProgressRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const animatedProgress = useSharedValue(clamped);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration: PROGRESS_ANIM_MS,
      easing: Easing.linear,
    });
  }, [clamped, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.cyan} />
            <Stop offset="100%" stopColor={Colors.tertiary} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.ring}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.35}
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
