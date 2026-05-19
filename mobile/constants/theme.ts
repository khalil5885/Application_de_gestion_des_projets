/**
 * Design System — single source of truth for colors, typography, spacing.
 *
 * Gradient colors are also centralised here so Button and screen headers
 * always stay in sync with the active theme.
 */

export const Colors = {
  light: {
    background: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceContainer: '#F0F2F8',
    surfaceContainerHigh: '#E8EBF4',
    card: '#FFFFFF',

    primary: '#321FDB',
    primaryLight: 'rgba(50,31,219,0.12)',
    primaryMuted: 'rgba(50,31,219,0.08)',
    // Gradient pair used by Button and hero headers
    gradientStart: '#321FDB',
    gradientEnd: '#4F46E5',
    // Hero header overlay (top → transparent)
    heroGradientTop: '#EEF0FF',

    secondary: '#FFA726',
    secondaryLight: 'rgba(255,167,38,0.12)',

    success: '#2EB85C',
    successLight: 'rgba(46,184,92,0.12)',
    warning: '#F9B115',
    warningLight: 'rgba(249,177,21,0.12)',
    danger: '#E55353',
    dangerLight: 'rgba(229,83,83,0.12)',
    info: '#3399FF',
    infoLight: 'rgba(51,153,255,0.12)',

    text: '#1A1D2B',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    border: '#E5E7EB',
    borderLight: 'rgba(0,0,0,0.06)',

    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    tabActive: '#321FDB',
    tabInactive: '#9CA3AF',

    shadowColor: '#000000',
  },
  dark: {
    background: '#0A0A0F',
    surface: '#13131A',
    surfaceContainer: '#1A1A24',
    surfaceContainerHigh: '#22222F',
    card: '#13131A',

    primary: '#6366F1',
    primaryLight: 'rgba(99,102,241,0.15)',
    primaryMuted: 'rgba(99,102,241,0.08)',
    gradientStart: '#6366F1',
    gradientEnd: '#4F46E5',
    heroGradientTop: '#1A1A2E',

    secondary: '#FFA726',
    secondaryLight: 'rgba(255,167,38,0.12)',

    success: '#34D399',
    successLight: 'rgba(52,211,153,0.12)',
    warning: '#FBBF24',
    warningLight: 'rgba(251,191,36,0.12)',
    danger: '#F87171',
    dangerLight: 'rgba(248,113,113,0.12)',
    info: '#60A5FA',
    infoLight: 'rgba(96,165,250,0.12)',

    text: '#F1F1F5',
    textSecondary: '#A0A3B1',
    textMuted: '#6B6F7E',
    textInverse: '#0A0A0F',

    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.04)',

    tabBar: '#13131A',
    tabBarBorder: 'rgba(255,255,255,0.06)',
    tabActive: '#6366F1',
    tabInactive: '#6B6F7E',

    shadowColor: '#000000',
  },
};

export const Typography = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
};
