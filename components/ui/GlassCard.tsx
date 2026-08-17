import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Spacing, glassCard } from '@/lib/theme';

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle> | undefined;
  /** Opaque deep-blue fill instead of the translucent glass. */
  deep?: boolean | undefined;
  /** Default true — Spacing.md inner padding. */
  padded?: boolean | undefined;
}

/** Translucent glass surface — the standard card of the design system. */
export function GlassCard({ children, style, deep = false, padded = true }: GlassCardProps) {
  return (
    <View style={[styles.card, deep && styles.deep, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassCard,
  },
  deep: {
    backgroundColor: Colors.deepBlue,
  },
  padded: {
    padding: Spacing.md,
  },
});
