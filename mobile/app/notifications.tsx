/**
 * Notifications Screen
 * Shows all notifications for the current user.
 * Supports mark-as-read individually or all at once.
 * Tapping a task/project notification navigates to that item.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { Notification } from '../types';

const NOTIF_ICONS: Record<Notification['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  task_assigned:        'person-add-outline',
  project_created:      'folder-open-outline',
  project_updated:      'folder-open-outline',
  project_completed:    'checkmark-circle-outline',
  comment_added:        'chatbubble-outline',
  request_created:      'document-text-outline',
  request_approved:     'checkmark-done-outline',
  request_rejected:     'close-circle-outline',
  workload_updated:     'stats-chart-outline',
  workload_overloaded:  'warning-outline',
  deadline:             'alarm-outline',
};

const NOTIF_COLORS: Record<Notification['type'], string> = {
  task_assigned:        '#6366F1',
  project_created:      '#34D399',
  project_updated:      '#34D399',
  project_completed:    '#34D399',
  comment_added:        '#60A5FA',
  request_created:      '#FFA726',
  request_approved:     '#34D399',
  request_rejected:     '#F87171',
  workload_updated:     '#A78BFA',
  workload_overloaded:  '#F87171',
  deadline:             '#F87171',
};

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const notifications       = useAppStore((s) => s.notifications);
  const markRead            = useAppStore((s) => s.markNotificationRead);
  const markAllRead         = useAppStore((s) => s.markAllNotificationsRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const headerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleNotifPress = (notif: Notification) => {
    markRead(notif.id);
    if (notif.targetType === 'task' && notif.targetId) {
      router.push(`/task/${notif.targetId}`);
    } else if (notif.targetType === 'project' && notif.targetId) {
      router.push(`/project/${notif.targetId}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn} hitSlop={8}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        )}
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          notifications.map((notif, index) => (
            <AnimatedNotifRow
              key={notif.id}
              notif={notif}
              index={index}
              onPress={handleNotifPress}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Animated notification row ────────────────────────────────────────────────

function AnimatedNotifRow({
  notif,
  index,
  onPress,
}: {
  notif: Notification;
  index: number;
  onPress: (n: Notification) => void;
}) {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 50, useNativeDriver: true, damping: 20, stiffness: 200 }),
    ]).start();
  }, []);

  const iconName  = NOTIF_ICONS[notif.type];
  const iconColor = NOTIF_COLORS[notif.type];

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        style={[
          styles.notifCard,
          {
            backgroundColor: notif.read ? colors.card : colors.primaryMuted,
            borderLeftColor: notif.read ? colors.border : colors.primary,
            ...Shadow.sm,
            shadowColor: colors.shadowColor,
          },
        ]}
        onPress={() => onPress(notif)}
      >
        {/* Icon */}
        <View style={[styles.notifIcon, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: colors.text, fontWeight: notif.read ? Typography.medium : Typography.bold }]}>
            {notif.title}
          </Text>
          <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
            {notif.body}
          </Text>
          <Text style={[styles.notifTime, { color: colors.textMuted }]}>
            {timeAgo(notif.createdAt)}
          </Text>
        </View>

        {/* Unread dot */}
        {!notif.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </Pressable>
    </Animated.View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>No notifications yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: { alignSelf: 'flex-start' },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: Typography.xs, fontWeight: Typography.bold },
  markAllBtn: { alignSelf: 'flex-start' },
  markAllText: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.sm },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: Typography.sm },
  notifBody: { fontSize: Typography.xs, lineHeight: 16 },
  notifTime: { fontSize: Typography.xs, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    marginTop: 4, flexShrink: 0,
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingTop: 80 },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { fontSize: Typography.sm },
});
