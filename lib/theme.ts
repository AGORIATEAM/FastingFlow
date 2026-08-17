/**
 * FastLife shared design system — single source of truth for all screens.
 * Canonical palette: deep-blue glassmorphism (base #050F1D / surface #0D2547).
 */

import type { FontVariant } from 'react-native';

export const Colors = {
  // Backgrounds
  bg: '#050F1D',
  deepBlue: '#0D2547',
  primaryContainer: '#0a1f3d',

  // Glass
  glass: 'rgba(13, 37, 71, 0.45)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  glassBorderDim: 'rgba(255, 255, 255, 0.06)',

  // Brand accents
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  tertiaryContainer: '#002517',
  ring: '#1a3060',

  // Text
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  /** Muted text that still passes WCAG AA on #050F1D — use instead of `${x}60` */
  mutedText: '#8fa3bf',
  outline: '#8e9098',
  white: '#ffffff',

  // Feedback
  error: '#ffb4ab',
  errorBg: 'rgba(147,0,10,0.12)',
  divider: 'rgba(255,255,255,0.05)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20, // standard horizontal padding
  xl: 24,
  xxl: 32,
  section: 20, // gap between sections
  tabBar: 100, // bottom padding to clear tab bar
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'SpaceGrotesk_700Bold',
} as const;

export const Typography = {
  // Sizes
  display: 48,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  bodySmall: 13,
  label: 11,

  // Weights
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
} as const;

/** Composed text presets — spread into StyleSheet entries. */
export const TextStyles = {
  displayTimer: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: Colors.white,
    fontVariant: ['tabular-nums'] as FontVariant[],
    letterSpacing: -1,
  },
  h1: { fontFamily: Fonts.bold, fontSize: Typography.h1, color: Colors.white },
  h2: { fontFamily: Fonts.bold, fontSize: Typography.h2, color: Colors.onSurface },
  h3: { fontFamily: Fonts.semibold, fontSize: Typography.h3, color: Colors.onSurface },
  body: { fontFamily: Fonts.regular, fontSize: Typography.body, color: Colors.onSurfaceVariant },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.label,
    color: Colors.mutedText,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export const Header = {
  height: 56,
  bg: 'rgba(13, 37, 71, 0.88)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
} as const;

/** Minimum comfortable touch target padding for small controls. */
export const HitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const Shadows = {
  glow: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
} as const;

// Shared glass card style object
export const glassCard = {
  backgroundColor: Colors.glass,
  borderWidth: 1,
  borderColor: Colors.glassBorder,
  borderRadius: Radius.xl,
} as const;

// Shared section title style
export const sectionTitle = {
  fontSize: Typography.h3,
  fontWeight: Typography.semibold,
  color: Colors.onSurface,
  marginBottom: Spacing.sm,
} as const;
