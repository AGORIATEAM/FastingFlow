import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Fonts, Radius } from '@/lib/theme';

export interface PhaseBadgeProps {
  label: string;
  /** Accent color of the dot glow, border and text (hex token). */
  color: string;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Metabolic phase pill: glowing 8x8 dot + uppercase label (home screen pattern). */
export function PhaseBadge({ label, color, style }: PhaseBadgeProps) {
  return (
    <View
      style={[styles.badge, { borderColor: `${color}40` }, style]}
      accessible
      accessibilityLabel={label}
    >
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.primaryContainer}60`,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  text: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
