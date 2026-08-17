import { StyleSheet, Text, View } from 'react-native';
import { Colors, Header, Spacing, Typography } from '@/lib/theme';

interface AppHeaderProps {
  title?: string;
  right?: React.ReactNode;
}

export function AppHeader({ title = 'FastLife', right }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>{title}</Text>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Header.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  brand: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    letterSpacing: -0.3,
    color: Colors.white,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
