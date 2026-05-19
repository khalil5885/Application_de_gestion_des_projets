/**
 * Admin Workload Screen
 * Mirrors Laravel WorkloadController (GET /admin/workload).
 * Shows each employee's task load, completion rate, active projects.
 * Tapping an employee navigates to their workload detail.
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

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Avatar, ProgressBar } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { EmployeeWorkload } from '../../types';

export default function AdminWorkloadScreen() {
  const { colors }    = useTheme();
  const router        = useRouter();
  const currentUser   = useAppStore((s) => s.currentUser);
  const workload      = useAppStore((s) => s.workload);

  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

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

  const totalTasks   = workload.reduce((s, w) => s + w.totalTasks, 0);
  const doneTasks    = workload.reduce((s, w) => s + w.doneTasks, 0);
  const overdueTasks = workload.reduce((s, w) => s + w.overdueTasks, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Team Workload</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary KPIs */}
        <View style={styles.kpiRow}>
          <SummaryPill label="Total Tasks" value={totalTasks} color={colors.primary} bg={colors.primaryLight} />
          <SummaryPill label="Done"         value={doneTasks}    color={colors.success} bg={colors.successLight} />
          <SummaryPill label="Overdue"      value={overdueTasks} color={colors.danger}  bg={colors.dangerLight} />
        </View>

        {/* Employee workload cards */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Team Members</Text>
        {workload.map((w, i) => (
          <WorkloadCard
            key={w.user.id}
            workload={w}
            index={i}
            onPress={() => router.push(`/admin/workload/${w.user.id}`)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryPill({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summaryPill, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
      <View style={[styles.summaryDot, { backgroundColor: bg }]}>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      </View>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function WorkloadCard({ workload: w, index, onPress }: { workload: EmployeeWorkload; index: number; onPress: () => void }) {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, delay: index * 70, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 70, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
  }, []);

  const loadColor =
    w.completionRate >= 70 ? colors.success :
    w.completionRate >= 40 ? colors.warning : colors.danger;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        style={[styles.card, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
        onPress={onPress}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <Avatar name={w.user.name} color={w.user.color} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.memberName, { color: colors.text }]}>{w.user.name}</Text>
            <Text style={[styles.memberEmail, { color: colors.textMuted }]}>{w.user.email}</Text>
            <View style={styles.projectTagRow}>
              {w.projects.slice(0, 2).map((p) => (
                <View key={p.id} style={[styles.projectTag, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.projectTagText, { color: colors.primary }]} numberOfLines={1}>{p.name}</Text>
                </View>
              ))}
              {w.projects.length > 2 && (
                <Text style={[styles.moreProjects, { color: colors.textMuted }]}>+{w.projects.length - 2}</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <MiniStat label="Total" value={w.totalTasks} />
          <MiniStat label="Done"  value={w.doneTasks} color={colors.success} />
          <MiniStat label="Active" value={w.inProgressTasks} color={colors.primary} />
          {w.overdueTasks > 0 && (
            <MiniStat label="Overdue" value={w.overdueTasks} color={colors.danger} />
          )}
        </View>

        {/* Completion bar */}
        <View style={styles.completionRow}>
          <Text style={[styles.completionLabel, { color: colors.textMuted }]}>Completion</Text>
          <Text style={[styles.completionPct, { color: loadColor }]}>{w.completionRate}%</Text>
        </View>
        <ProgressBar value={w.completionRate} color={loadColor} height={6} />
      </Pressable>
    </Animated.View>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, { color: color ?? colors.text }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  guardText: { fontSize: Typography.base },

  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md, gap: Spacing.sm },
  backCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.md },

  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryPill: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 6 },
  summaryDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontSize: Typography.lg, fontWeight: Typography.black },
  summaryLabel: { fontSize: Typography.xs },

  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, marginTop: Spacing.sm },

  card: { borderRadius: Radius.xl, padding: Spacing.base, gap: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  memberName: { fontSize: Typography.base, fontWeight: Typography.bold },
  memberEmail: { fontSize: Typography.xs, marginTop: 2 },
  projectTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  projectTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  projectTagText: { fontSize: 10, fontWeight: Typography.semibold },
  moreProjects: { fontSize: 10, alignSelf: 'center' },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  miniStat: { alignItems: 'center', gap: 2 },
  miniStatValue: { fontSize: Typography.lg, fontWeight: Typography.black },
  miniStatLabel: { fontSize: Typography.xs },

  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel: { fontSize: Typography.sm },
  completionPct: { fontSize: Typography.sm, fontWeight: Typography.bold },
});
