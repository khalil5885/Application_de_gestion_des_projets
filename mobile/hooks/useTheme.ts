/**
 * useTheme Hook
 * Provides theme colors and helpers to any component.
 * Usage: const { colors, isDark } = useTheme();
 */

import { Colors } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

export function useTheme() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return {
    colors,
    isDark: isDarkMode,
  };
}
