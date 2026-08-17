import { StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Fonts, Radius, Typography } from '@/lib/theme';

import { PressableScale } from './PressableScale';
import type { HapticType } from './PressableScale';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean | undefined;
  haptic?: HapticType | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  /** Switches text/border (and primary fill) to the error palette. */
  danger?: boolean | undefined;
}

/** Filled pill CTA — cyan fill, dark label. Haptic 'medium' by default. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  haptic = 'medium',
  style,
  danger = false,
}: ButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={haptic}
      accessibilityLabel={label}
      style={[
        styles.base,
        styles.primary,
        danger && styles.primaryDanger,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, styles.primaryLabel, danger && styles.dangerLabel]}>{label}</Text>
    </PressableScale>
  );
}

/** Outlined pill — transparent fill, glass border. Haptic 'light' by default. */
export function GhostButton({
  label,
  onPress,
  disabled = false,
  haptic = 'light',
  style,
  danger = false,
}: ButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={haptic}
      accessibilityLabel={label}
      style={[
        styles.base,
        styles.ghost,
        danger && styles.ghostDanger,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, styles.ghostLabel, danger && styles.dangerLabel]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.body + 1,
    textAlign: 'center',
  },

  primary: {
    backgroundColor: Colors.cyan,
  },
  primaryLabel: {
    color: Colors.bg,
  },
  primaryDanger: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
  },

  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ghostLabel: {
    color: Colors.onSurface,
  },
  ghostDanger: {
    borderColor: Colors.error,
  },

  dangerLabel: {
    color: Colors.error,
  },

  disabled: {
    opacity: 0.5,
  },
});
