import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { RefreshControlProps, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/lib/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Default false. When true, wraps children in the standard ScrollView. */
  scroll?: boolean | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  contentStyle?: StyleProp<ViewStyle> | undefined;
  /** Forwarded to the ScrollView when scroll is true. */
  refreshControl?: ReactElement<RefreshControlProps> | undefined;
}

/** Screen root: safe area (top) on the app background. */
export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  refreshControl,
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top']}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.tabBar,
  },
  fill: {
    flex: 1,
  },
});
