/**
 * Button Component
 * Five variants: primary (gradient) | secondary | outline | ghost | danger
 * Uses Reanimated 3 for press scale feedback.
 * Gradient colors sourced from theme — works correctly in both light and dark mode.
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Typography } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const SIZE_MAP = {
  sm: { paddingV: 6,  paddingH: 14, fontSize: Typography.sm   },
  md: { paddingV: 11, paddingH: 20, fontSize: Typography.base },
  lg: { paddingV: 16, paddingH: 28, fontSize: Typography.md   },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;
  const { paddingV, paddingH, fontSize } = SIZE_MAP[size];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      damping: 20,
      stiffness: 350,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 20,
      stiffness: 350,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyle = (): { bg?: string; border?: string; textColor: string } => {
    switch (variant) {
      case 'secondary': return { bg: colors.surfaceContainerHigh, textColor: colors.text };
      case 'outline':   return { border: colors.primary, textColor: colors.primary };
      case 'ghost':     return { textColor: colors.primary };
      case 'danger':    return { bg: colors.danger, textColor: '#FFFFFF' };
      default:          return { textColor: '#FFFFFF' };
    }
  };

  const { bg, border, textColor } = getVariantStyle();
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator size="small" color={textColor} />
  ) : (
    <>
      {icon}
      <Text style={[styles.label, { fontSize, color: textColor }, textStyle]}>{label}</Text>
    </>
  );

  // Primary: theme-aware gradient
  if (variant === 'primary') {
    return (
      <Animated.View
        style={[
          { transform: [{ scale }] },
          {
            borderRadius: Radius.md,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            opacity: isDisabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <Pressable
          onPress={!isDisabled ? onPress : undefined}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ borderRadius: Radius.md, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradientInner,
              { paddingVertical: paddingV, paddingHorizontal: paddingH },
            ]}
          >
            {content}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={!isDisabled ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: Radius.md,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: bg,
          borderWidth: border ? 1.5 : 0,
          borderColor: border ?? 'transparent',
        }}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: Typography.semibold,
  },
  gradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
