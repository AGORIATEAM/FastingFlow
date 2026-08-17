import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { PressableScale } from '@/components/ui';
import { Colors, Fonts, Header, HitSlop, Spacing, Typography } from '@/lib/theme';

function BackChevronIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={Colors.onSurface}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface AppHeaderBrandProps {
  /** Brand variant: "FastLife" wordmark on the left. */
  brand: true;
  /** Optional element aligned to the right edge. */
  right?: ReactNode | undefined;
  title?: never;
  onBack?: never;
}

interface AppHeaderTitleProps {
  /** Title variant: centered title with optional back chevron. */
  title: string;
  onBack?: (() => void) | undefined;
  brand?: never;
  right?: never;
}

export type AppHeaderProps = AppHeaderBrandProps | AppHeaderTitleProps;

/**
 * Shared app bar.
 * - `<AppHeader brand right={...} />` — brand wordmark left, optional right slot.
 * - `<AppHeader title="..." onBack={...} />` — back chevron + centered title.
 */
export function AppHeader(props: AppHeaderProps) {
  if ('brand' in props && props.brand) {
    return (
      <View style={styles.header}>
        <Text style={styles.brand} maxFontSizeMultiplier={1.3} accessibilityRole="header">
          FastLife
        </Text>
        {props.right ? <View style={styles.right}>{props.right}</View> : null}
      </View>
    );
  }

  const { title, onBack } = props;
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <PressableScale
            onPress={onBack}
            hitSlop={HitSlop}
            accessibilityLabel="Retour"
            style={styles.backBtn}
          >
            <BackChevronIcon />
          </PressableScale>
        ) : null}
      </View>
      <Text
        style={styles.title}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Header.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  brand: {
    fontFamily: Fonts.bold,
    fontSize: Typography.h3,
    letterSpacing: -0.3,
    color: Colors.white,
    paddingHorizontal: Spacing.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  side: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.semibold,
    fontSize: Typography.body + 1,
    color: Colors.onSurface,
    letterSpacing: 0.1,
  },
});
