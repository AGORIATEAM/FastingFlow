import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Spacing, TextStyles } from '@/lib/theme';

import { GhostButton } from './Button';

export interface EmptyStateCta {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  cta?: EmptyStateCta | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Centered empty placeholder: icon, h3 title, body copy, optional ghost CTA. */
export function EmptyState({ icon, title, body, cta, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {cta ? <GhostButton label={cta.label} onPress={cta.onPress} style={styles.cta} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...TextStyles.h3,
    textAlign: 'center',
  },
  body: {
    ...TextStyles.body,
    textAlign: 'center',
    lineHeight: 21,
  },
  cta: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
});
