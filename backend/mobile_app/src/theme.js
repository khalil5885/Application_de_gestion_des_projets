// ============================================================
//  app-wide design tokens — mirrors the web CoreUI dark theme
// ============================================================

export const colors = {
  // Backgrounds
  bg: '#0f1117',
  card: '#1a1d27',
  cardAlt: '#1e2130',
  border: '#2a2d3e',

  // Brand / accent
  primary: '#4f8ef7',
  primaryDark: '#3a6fd8',

  // Text
  textPrimary: '#e8ecf4',
  textSecondary: '#8892a4',
  textMuted: '#555d70',

  // Status badges (match migration enum)
  pending: '#f59e0b',
  in_progress: '#4f8ef7',
  completed: '#22c55e',
  on_hold: '#6b7280',

  // Role badges
  admin: '#ef4444',
  employee: '#4f8ef7',
  client: '#22c55e',

  // Utility
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  full: 999,
}

export const font = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
}

// Reusable card style
export const cardStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.md,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
}
