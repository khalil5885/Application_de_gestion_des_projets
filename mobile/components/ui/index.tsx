/**
 * Reusable UI Components
 *
 * Badge       — Status / priority chip with semantic colors
 * Avatar      — Initials avatar with tinted background
 * AvatarStack — Overlapping row of avatars
 * ProgressBar — Animated fill bar (RN Animated, non-native driver for width)
 * Skeleton    — Shimmer loading placeholder
 * Divider     — 1 px separator
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Typography } from '../../constants/theme';
import { ProjectStatus, TaskStatus, Priority } from '../../types';

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = ProjectStatus | TaskStatus | Priority | 'approved' | 'rejected' | 'pending';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant, size = 'md' }: BadgeProps) {
  const { colors } = useTheme();

  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'done':
      case 'approved':
        return { bg: colors.successLight, text: colors.success };
      case 'in_progress':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'ready_for_review':
        return { bg: colors.infoLight, text: colors.info };
      case 'pending':
      case 'todo':
        return { bg: colors.warningLight, text: colors.warning };
      case 'on_hold':
      case 'rejected':
        return { bg: colors.dangerLight, text: colors.danger };
      case 'high':
        return { bg: colors.dangerLight, text: colors.danger };
      case 'medium':
        return { bg: colors.warningLight, text: colors.warning };
      case 'low':
        return { bg: colors.successLight, text: colors.success };
      default:
        return { bg: colors.surfaceContainerHigh, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: small ? 6 : 8,
          paddingVertical: small ? 2 : 4,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: text, fontSize: small ? Typography.xs : Typography.sm }]}>
        {label.replace(/_/g, ' ').toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ name, color, size = 32, style }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { color, fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

// ─── AvatarStack ─────────────────────────────────────────────────────────────

interface AvatarStackProps {
  users: { name: string; color: string }[];
  max?: number;
  size?: number;
}

export function AvatarStack({ users, max = 4, size = 26 }: AvatarStackProps) {
  const { colors } = useTheme();
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const overlap = Math.floor(size * 0.35);

  return (
    <View style={[styles.avatarStack, { height: size }]}>
      {visible.map((user, index) => (
        <View
          key={index}
          style={{ marginLeft: index === 0 ? 0 : -overlap, zIndex: visible.length - index }}
        >
          <Avatar
            name={user.name}
            color={user.color}
            size={size}
            style={{ borderWidth: 2, borderColor: colors.surface }}
          />
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceContainerHigh,
            marginLeft: -overlap,
            borderWidth: 2,
            borderColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[styles.overflowText, { color: colors.textSecondary, fontSize: size * 0.3 }]}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color, height = 4 }: ProgressBarProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.primary;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value,
      duration: 700,
      useNativeDriver: false, // 'width' cannot use native driver
    }).start();
  }, [value]);

  return (
    <View style={[styles.progressTrack, { height, backgroundColor: colors.surfaceContainerHigh }]}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            // Interpolating 0→100 to percentage string avoids 'as any' cast
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
            height,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

interface SkeletonProps {
  /** Accept any valid RN dimension value — number (px) or string percentage */
  width?: ViewStyle['width'];
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Radius.sm,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.surfaceContainerHigh, opacity },
        style,
      ]}
    />
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: Typography.black,
    letterSpacing: 0.4,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: Typography.bold,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overflowText: {
    fontWeight: Typography.bold,
  },
  progressTrack: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.full,
  },
});
