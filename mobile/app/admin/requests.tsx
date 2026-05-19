/**
 * Admin Requests Screen
 * Mirrors Laravel Admin/RequestController:
 * - List all requests (GET /admin/requests)
 * - Approve request (PATCH /admin/requests/{id}/approve)
 * - Reject request (PATCH /admin/requests/{id}/reject)
 *
 * Employee-submitted requests (deadline extensions, resources, budget).
 * Admin can approve or reject each one.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Badge, Avatar } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { Request, RequestStatus } from '../../types';

const TYPE_ICON: Record<Request['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  deadline_extension: 'calendar-outline',
  resource:           'people-outline',
  budget:             'cash-outline',
};

const TYPE_COLOR: Record<Request['type'], string> = {
  deadline_extension: '#F87171',
  resource:           '#34D399',
  budget:             '#FFA726',
};

const STATUS_FILTER: { key: 'all' | RequestStatus; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminRequestsScreen() {
  const { colors }        = useTheme();
  const router            = useRouter();
  const currentUser       = useAppStore((s) => s.currentUser);
  const requests          = useAppStore((s) => s.requests);
  const approveRequest    = useAppStore((s) => s.approveRequest);
  const rejectRequest     = useAppStore((s) => s.rejectRequest);

  const [filter, setFilter] = useState<'all' | RequestStatus>('pending');

  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Admin guard
  if (currentUser?.global_role !== 'admin') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.danger} />
          <Text style={[styles.guardText, { color: colors.textMuted }]}>Admin access only</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApprove = (req: Request) => {
    Alert.alert(
      'Approve Request',
      `Approve "${req.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approveRequest(req.id) },
      ]
    );
  };

  const handleReject = (req: Request) => {
    Alert.alert(
      'Reject Request',
      `Reject "${req.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectRequest(req.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Requests</Text>
          {pendingCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {STATUS_FILTER.map((f) => {
          const isActive = filter === f.key;
          const cnt = f.key === 'all' ? requests.length : requests.filter(r => r.status === f.key).length;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterPill, { backgroundColor: isActive ? colors.primary : colors.surfaceContainer }]}
            >
              <Text style={[styles.filterLabel, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                {f.label}
              </Text>
              <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh }]}>
                <Text style={[styles.filterCountText, { color: isActive ? '#FFF' : colors.textMuted }]}>{cnt}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No {filter} requests</Text>
          </View>
        ) : (
          filtered.map((req, index) => (
            <RequestCard
              key={req.id}
              req={req}
              index={index}
              onApprove={() => handleApprove(req)}
              onReject={() => handleReject(req)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── RequestCard ──────────────────────────────────────────────────────────────

function RequestCard({
  req, index, onApprove, onReject,
}: {
  req: Request; index: number;
  onApprove: () => void; onReject: () => void;
}) {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 60, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
  }, []);

  const iconColor = TYPE_COLOR[req.type];

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }, { opacity, transform: [{ translateY }] }]}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={[styles.typeIcon, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={TYPE_ICON[req.type]} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{req.title}</Text>
          <Text style={[styles.cardProject, { color: colors.primary }]}>{req.project.name}</Text>
        </View>
        <Badge label={req.status} variant={req.status} size="sm" />
      </View>

      {/* Description */}
      <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
        {req.description}
      </Text>

      {/* Requester + time */}
      <View style={styles.cardMeta}>
        <Avatar name={req.requestedBy.name} color={req.requestedBy.color} size={22} />
        <Text style={[styles.cardRequester, { color: colors.textMuted }]}>{req.requestedBy.name}</Text>
        <Text style={[styles.cardDot, { color: colors.textMuted }]}>·</Text>
        <Text style={[styles.cardTime, { color: colors.textMuted }]}>{timeAgo(req.createdAt)}</Text>
      </View>

      {/* Action buttons — only for pending */}
      {req.status === 'pending' && (
        <View style={styles.cardActions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.successLight, flex: 1 }]}
            onPress={onApprove}
          >
            <Ionicons name="checkmark-outline" size={16} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.dangerLight, flex: 1 }]}
            onPress={onReject}
          >
            <Ionicons name="close-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Reject</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  guardText: { fontSize: Typography.base },

  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md, gap: Spacing.sm },
  backCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFF', fontSize: Typography.xs, fontWeight: Typography.bold },

  filters: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.sm, alignItems: 'center', height: 52 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, height: 36 },
  filterLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  filterCount: { minWidth: 20, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCountText: { fontSize: 10, fontWeight: Typography.bold },

  list: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.md },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: Typography.base },

  card: { borderRadius: Radius.xl, padding: Spacing.base, gap: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  typeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.bold, lineHeight: 20 },
  cardProject: { fontSize: Typography.xs, marginTop: 2, fontWeight: Typography.semibold },
  cardDesc: { fontSize: Typography.sm, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardRequester: { fontSize: Typography.xs },
  cardDot: { fontSize: Typography.xs },
  cardTime: { fontSize: Typography.xs },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.md },
  actionText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
});