import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Colors, Fonts, Header, Radius, Spacing, Typography } from '@/lib/theme';

import { PressableScale } from './PressableScale';

function ChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={Colors.onSurfaceVariant}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export interface ListRowProps {
  icon: ReactNode;
  /** Background of the 34x34 icon square, default Colors.divider. */
  iconBg?: string | undefined;
  label: string;
  sublabel?: string | undefined;
  /** Replaces the chevron on the right side when provided. */
  rightElement?: ReactNode | undefined;
  /** Default true — draws the chevron when no rightElement is given. */
  chevron?: boolean | undefined;
  onPress?: (() => void) | undefined;
  /** Last row of a card: no bottom border. */
  isLast?: boolean | undefined;
  /** Renders the label in Colors.error. */
  destructive?: boolean | undefined;
}

/** Settings-style row (profile screen pattern) with press scale feedback. */
export function ListRow({
  icon,
  iconBg = Colors.divider,
  label,
  sublabel,
  rightElement,
  chevron = true,
  onPress,
  isLast = false,
  destructive = false,
}: ListRowProps) {
  const content = (
    <>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.textBlock}>
          <Text style={[styles.label, destructive && styles.labelDestructive]} numberOfLines={1}>
            {label}
          </Text>
          {sublabel ? (
            <Text style={styles.sublabel} numberOfLines={1}>
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>{rightElement ?? (chevron ? <ChevronIcon /> : null)}</View>
    </>
  );

  const rowStyle = [styles.row, !isLast && styles.rowBorder];
  const a11yLabel = sublabel ? `${label}, ${sublabel}` : label;

  if (onPress) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={a11yLabel} style={rowStyle}>
        {content}
      </PressableScale>
    );
  }

  return (
    <View style={rowStyle} accessible accessibilityLabel={a11yLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: Typography.body,
    color: Colors.white,
  },
  labelDestructive: {
    color: Colors.error,
  },
  sublabel: {
    fontFamily: Fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  right: {
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
