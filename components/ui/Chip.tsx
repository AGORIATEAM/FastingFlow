import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Fonts, HitSlop, Radius, Typography } from '@/lib/theme';

import { PressableScale } from './PressableScale';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** ~18% alpha fill when the accent is a hex token; container fallback otherwise. */
function selectedBackground(color: string): string {
  return HEX_COLOR.test(color) ? `${color}2E` : Colors.primaryContainer;
}

export interface ChipProps {
  label: string;
  selected?: boolean | undefined;
  /** When provided the chip is pressable (haptic 'selection'); otherwise static. */
  onPress?: (() => void) | undefined;
  /** Accent color, default Colors.secondary. */
  color?: string | undefined;
  icon?: ReactNode | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Compact pill used for protocol / filter / tag selections. */
export function Chip({
  label,
  selected = false,
  onPress,
  color = Colors.secondary,
  icon,
  style,
}: ChipProps) {
  const containerStyle = [
    styles.chip,
    selected && { backgroundColor: selectedBackground(color), borderColor: color },
    style,
  ];

  const content = (
    <>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, selected && { color }]} numberOfLines={1}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        haptic="selection"
        hitSlop={HitSlop}
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={containerStyle}
      >
        {content}
      </PressableScale>
    );
  }

  return (
    <View style={containerStyle} accessible accessibilityLabel={label}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: Colors.glass,
    borderColor: Colors.glassBorderDim,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall - 1,
    color: Colors.onSurfaceVariant,
  },
});
