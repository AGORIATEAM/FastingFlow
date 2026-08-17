import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Fonts, Spacing, TextStyles, glassCard } from '@/lib/theme';

export interface StatTileProps {
  icon: ReactNode;
  value: string;
  /** Small accent line under the value (e.g. trend or unit). */
  sub?: string | undefined;
  label: string;
  /** Accent color for the sub line, default Colors.secondary. */
  accent?: string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Compact stat tile: icon on top, bold value, accent sub line, uppercase label. */
export function StatTile({
  icon,
  value,
  sub,
  label,
  accent = Colors.secondary,
  style,
}: StatTileProps) {
  const a11ySub = sub ? `, ${sub}` : '';
  return (
    <View
      style={[styles.tile, style]}
      accessible
      accessibilityLabel={`${label}: ${value}${a11ySub}`}
    >
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {sub ? (
        <Text style={[styles.sub, { color: accent }]} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    ...glassCard,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  icon: {
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: Fonts.bold,
    fontSize: 21,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
  label: {
    ...TextStyles.label,
  },
});
