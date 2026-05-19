/**
 * Employee Workload Detail
 * Mirrors Laravel WorkloadController (GET /admin/workload/{user}).
 * Shows detailed task breakdown for a specific employee.
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/useAppStore';
import { Avatar, Badge, ProgressBar } from '../../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../../constants/theme';

export default function EmployeeWorkloadDetailScreen() {
  const { userId }  = useLocalSearchParams<{ userId: string }>();
  const { colors }  = useTheme();
  const router      = useRouter();
  const workload    = useAppStore((s) => s.workload);
  const tasks       = useAppStore((s) => s.tasks);
  const currentUser = useAppStore((s) => s.currentUser);

  const w = workload.find((w) => w.user.id === Number(userId));

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
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

  if (!w) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.centered}>
          <Text style={{ color: colors.textMuted }}>Employee not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get tasks assigned to this employee
  const employeeTasks = tasks.filter((t) => t.assignee?.id === w.user.id && !t.parentId);
  const loadColor =
    w.completionRate >= 70 ? colors.success :
    w.completionRate >= 40 ? colors.warning : colors.danger;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity }]}>
        <LinearGradient colors={[colors.heroGradientTop, colors.background]} style={StyleSheet.absoluteFill} />
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>
        <View style={styles.heroContent}>
          <Avatar name={w.user.name} color={w.user.color} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroName, { color: colors.text }]}>{w.user.name}</Text>
            <Text style={[styles.heroEmail, { color: colors.textMuted }]}>{w.user.email}</Text>
            <View style={[styles.rolePill, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>Employee</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ flex: 1, transform: [{ translateY: slideY }] }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Completion */}
        <View style={[styles.completionCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>COMPLETION RATE</Text>
            <Text style={[styles.bigPct, { color: loadColor }]}>{w.completionRate}%</Text>
          </View>
          <ProgressBar value={w.completionRate} color={loadColor} height={8} />
          <View style={styles.statsRow}>
            <StatChip label="Total"   value={w.totalTasks}      color={colors.text}    />
            <StatChip label="Done"    value={w.doneTasks}        color={colors.success} />
            <StatChip label="Active"  value={w.inProgressTasks}  color={colors.primary} />
            <StatChip label="Overdue" value={w.overdueTasks}     color={colors.danger}  />
          </View>
        </View>

        {/* Projects */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned Projects</Text>
        {w.projects.map((p) => (
          <View key={p.id} style={[styles.projectRow, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
            <View style={[styles.projectDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.projectName, { color: colors.text }]}>{p.name}</Text>
            <View style={[styles.taskCountPill, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.taskCountText, { color: colors.primary }]}>{p.taskCount} tasks</Text>
            </View>
          </View>
        ))}

        {/* Task list */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks ({employeeTasks.length})</Text>
        {employeeTasks.map((task) => (
          <Pressable
            key={task.id}
            style={[styles.taskRow, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
            onPress={() => router.push(`/task/${task.id}`)}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
              <View style={styles.taskMeta}>
                <Text style={[styles.taskDue, { color: colors.textMuted }]}>
                  {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            </View>
            <Badge label={task.status} variant={task.status} size="sm" />
          </Pressable>
        ))}
        {employeeTasks.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks assigned</Text>
        )}
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  guardText: { fontSize: Typography.base },

  hero: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, overflow: 'hidden', gap: Spacing.md },
  backBtn: { paddingTop: Spacing.sm },
  backCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroName: { fontSize: Typography.xl, fontWeight: Typography.black },
  heroEmail: { fontSize: Typography.sm, marginTop: 2 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6 },
  roleText: { fontSize: Typography.xs, fontWeight: Typography.bold },

  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.md },

  completionCard: { borderRadius: Radius.xl, padding: Spacing.base, gap: Spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 1 },
  bigPct: { fontSize: Typography.xl, fontWeight: Typography.black },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statChip: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.black },
  statLabel: { fontSize: Typography.xs },

  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, marginTop: Spacing.sm },

  projectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg },
  projectDot: { width: 8, height: 8, borderRadius: 4 },
  projectName: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold },
  taskCountPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  taskCountText: { fontSize: Typography.xs, fontWeight: Typography.bold },

  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg },
  taskTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  taskMeta: { flexDirection: 'row', gap: 8 },
  taskDue: { fontSize: Typography.xs },
  emptyText: { textAlign: 'center', fontSize: Typography.sm, paddingVertical: Spacing.md },
});
