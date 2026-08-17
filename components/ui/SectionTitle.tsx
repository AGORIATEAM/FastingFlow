import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Spacing, TextStyles } from '@/lib/theme';

export interface SectionTitleProps {
  title: string;
  /** Accent bar color, default Colors.secondaryContainer. */
  accent?: string | undefined;
  /** Optional element aligned to the right edge. */
  right?: ReactNode | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Section header row: vertical accent bar + h3 title (profile screen pattern). */
export function SectionTitle({
  title,
  accent = Colors.secondaryContainer,
  right,
  style,
}: SectionTitleProps) {
  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  accentBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  title: {
    ...TextStyles.h3,
    flexShrink: 1,
  },
  right: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
