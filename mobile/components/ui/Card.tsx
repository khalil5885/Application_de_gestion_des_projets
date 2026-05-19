/**
 * Card Component
 * Animated pressable card using Reanimated 3.
 * Scale springs on press-in/out for satisfying tactile feedback.
 * When no onPress is provided, renders as a plain static surface.
 */

import React from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Shadow, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  animated?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padding = Spacing.base,
  animated = true,
}: CardProps) {
  const { colors } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animated && onPress) {
      Animated.spring(scale, {
        toValue: 0.97,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      Animated.spring(scale, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        styles.card,
        {
          backgroundColor: colors.card,
          padding,
          shadowColor: colors.shadowColor,
          ...Shadow.md,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
  },
});
