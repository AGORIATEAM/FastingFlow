/**
 * FastLife shared design system — single source of truth for all screens.
 * NO react-native-reanimated. NO inline magic numbers.
 */

export const Colors = {
  // Backgrounds
  bg: '#050F1D',
  surface: '#131316',
  surfaceContainer: '#1f1f22',
  surfaceHigh: '#292a2c',
  deepBlue: '#0D2547',

  // Glass
  glass: 'rgba(13, 37, 71, 0.45)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  glassBorderDim: 'rgba(255, 255, 255, 0.06)',

  // Brand
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  tertiaryContainer: '#002517',
  primaryContainer: '#0a1f3d',

  // Text
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  outline: '#8e9098',
  white: '#ffffff',

  // Feedback
  error: '#ffb4ab',
  errorBg: 'rgba(147,0,10,0.12)',
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

export const Typography = {
  // Sizes
  display: 48,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  bodySmall: 13,
  label: 11,
  micro: 9,

  // Weights
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
} as const;

export const Header = {
  height: 56,
  bg: 'rgba(13, 37, 71, 0.88)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
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
