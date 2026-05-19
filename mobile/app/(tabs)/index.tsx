/**
 * Dashboard Screen — Role-based
 * Mirrors frontend Dashboard.jsx which renders AdminDashboard / EmployeeDashboard / ClientDashboard
 * based on user.global_role.
 *
 * Admin:    KPIs, recent activity, upcoming deadlines, pending requests badge
 * Employee: My tasks, productivity, upcoming deadlines, recent comments
 * Client:   My projects progress, milestones, recent activity
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
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Badge, Avatar, ProgressBar } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { Project, Task } from '../../types';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const currentUser = useAppStore((s) => s.currentUser);
  const role = currentUser?.global_role ?? 'employee';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {role === 'admin'    && <AdminDashboard />}
      {role === 'employee' && <EmployeeDashboard />}
      {role === 'client'   && <ClientDashboard />}
    </SafeAreaView>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const projects    = useAppStore((s) => s.projects);
  const tasks       = useAppStore((s) => s.tasks);
  const requests    = useAppStore((s) => s.requests);
  const users       = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const dashboard   = useAppStore((s) => s.dashboard.admin);

  const completionRate = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;
  const s = {
    activeProjects: dashboard?.stats?.activeProjects ?? projects.filter((p) => p.status === 'in_progress').length,
    completionRate: dashboard?.stats?.completionRate ?? completionRate,
    highRiskProjects: dashboard?.stats?.highRiskProjects ?? projects.filter((p) => p.riskLevel === 'high').length,
    mediumRiskProjects: dashboard?.stats?.mediumRiskProjects ?? projects.filter((p) => p.riskLevel === 'medium').length,
  };
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const reviewTasks     = tasks.filter((t) => t.status === 'ready_for_review').length;
  const activity = dashboard?.recentActivity ?? [];

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity, transform: [{ translateY: slideY }] }]}>
        <LinearGradient colors={[colors.heroGradientTop, 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>Good morning,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{currentUser?.name} 👋</Text>
          </View>
          <Pressable
            style={[styles.notifBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/notifications')}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.notifDot, { backgroundColor: colors.danger }]}>
                <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <KpiCard label="Active Projects" value={s.activeProjects} icon="briefcase-outline" color={colors.primary} bg={colors.primaryLight} onPress={() => router.push('/(tabs)/projects')} />
        <KpiCard label="Team Members"   value={users.filter(u => u.global_role !== 'client').length} icon="people-outline"     color={colors.info}    bg={colors.infoLight}    onPress={() => router.push('/(tabs)/team')} />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard label="Pending Review"  value={reviewTasks}     icon="time-outline"          color={colors.warning} bg={colors.warningLight} onPress={() => router.push('/admin/requests')} />
        <KpiCard label="Requests"        value={pendingRequests} icon="document-text-outline"  color={colors.danger}  bg={colors.dangerLight}  onPress={() => router.push('/admin/requests')} />
      </View>

      {/* Completion overview */}
      <Card style={styles.card} padding={Spacing.base}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Portfolio Completion</Text>
        <View style={[styles.rowBetween, { marginBottom: 8 }]}>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>Across all active projects</Text>
          <Text style={[styles.bigPct, { color: colors.primary }]}>{s.completionRate}%</Text>
        </View>
        <ProgressBar value={s.completionRate} height={8} />
        <View style={styles.riskRow}>
          <View style={[styles.riskPill, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="warning-outline" size={12} color={colors.danger} />
            <Text style={[styles.riskText, { color: colors.danger }]}>{s.highRiskProjects} high risk</Text>
          </View>
          <View style={[styles.riskPill, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="warning-outline" size={12} color={colors.warning} />
            <Text style={[styles.riskText, { color: colors.warning }]}>{s.mediumRiskProjects} medium risk</Text>
          </View>
        </View>
      </Card>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        </View>
        {activity.slice(0, 5).map((item, i) => (
          <ActivityRow key={activityKey(item, i)} action={activityAction(item)} target={activityTarget(item)} user={activityUser(item)} time={activityTime(item)} />
        ))}
        {activity.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent activity yet.</Text>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <QuickBtn icon="person-add-outline" label="New User"    color={colors.primary} onPress={() => router.push('/admin/create-user')} />
          <QuickBtn icon="folder-open-outline" label="Projects"   color={colors.success} onPress={() => router.push('/(tabs)/projects')} />
          <QuickBtn icon="people-outline"      label="Workload"   color={colors.warning} onPress={() => router.push('/admin/workload')} />
          <QuickBtn icon="document-text-outline" label="Requests" color={colors.danger}  onPress={() => router.push('/admin/requests')} />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── EMPLOYEE DASHBOARD ───────────────────────────────────────────────────────

function EmployeeDashboard() {
  const { colors } = useTheme();
  const router      = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const tasks       = useAppStore((s) => s.tasks);
  const projects    = useAppStore((s) => s.projects);
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const dashboard   = useAppStore((s) => s.dashboard.employee);

  const myTasks     = tasks.filter((t) => t.assignee?.id === currentUser?.id && !t.parentId);
  const myProjects  = projects.filter((p) => p.members.some((m) => m.id === currentUser?.id));
  const s           = {
    completionRate: dashboard?.stats?.completionRate ??
      (myTasks.length ? Math.round((myTasks.filter((t) => t.status === 'done').length / myTasks.length) * 100) : 0),
  };
  const reviewTasks = myTasks.filter((t) => t.status === 'ready_for_review');

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity, transform: [{ translateY: slideY }] }]}>
        <LinearGradient colors={[colors.heroGradientTop, 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{currentUser?.name} 👋</Text>
          </View>
          <Pressable
            style={[styles.notifBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/notifications')}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.notifDot, { backgroundColor: colors.danger }]}>
                <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* Task KPIs */}
      <View style={styles.kpiRow}>
        <KpiCard label="My Tasks"       value={myTasks.length}                            icon="checkmark-circle-outline" color={colors.primary} bg={colors.primaryLight} onPress={() => router.push('/(tabs)/tasks')} />
        <KpiCard label="In Progress"    value={myTasks.filter(t=>t.status==='in_progress').length} icon="time-outline"          color={colors.warning} bg={colors.warningLight} onPress={() => router.push('/(tabs)/tasks')} />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard label="Completed"      value={myTasks.filter(t=>t.status==='done').length}          icon="trophy-outline"        color={colors.success} bg={colors.successLight} onPress={() => router.push('/(tabs)/tasks')} />
        <KpiCard label="Pending Review" value={reviewTasks.length}                                   icon="hourglass-outline"     color={colors.info}    bg={colors.infoLight}    onPress={() => router.push('/(tabs)/tasks')} />
      </View>

      {/* Productivity */}
      <Card style={styles.card} padding={Spacing.base}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>My Productivity</Text>
          <Text style={[styles.bigPct, { color: colors.primary }]}>{s.completionRate}%</Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>Task completion rate</Text>
        <ProgressBar value={s.completionRate} height={8} />
      </Card>

      {/* My Projects */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Projects</Text>
          <Pressable onPress={() => router.push('/(tabs)/projects')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>View all →</Text>
          </Pressable>
        </View>
        {myProjects.slice(0, 3).map((p) => (
          <Pressable
            key={p.id}
            style={[styles.projectRow, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
            onPress={() => router.push(`/project/${p.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
              <ProgressBar value={p.progress} height={4} />
            </View>
            <Text style={[styles.projectPct, { color: colors.primary }]}>{p.progress}%</Text>
          </Pressable>
        ))}
        {myProjects.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No projects assigned yet.</Text>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <QuickBtn icon="add-circle-outline"    label="New Task"    color={colors.primary} onPress={() => router.push('/(tabs)/tasks')} />
          <QuickBtn icon="document-text-outline" label="Request"     color={colors.warning} onPress={() => router.push('/employee/requests')} />
          <QuickBtn icon="notifications-outline" label="Notifs"      color={colors.info}    onPress={() => router.push('/notifications')} />
          <QuickBtn icon="person-circle-outline" label="Profile"     color={colors.success} onPress={() => router.push('/(tabs)/profile')} />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────

function ClientDashboard() {
  const { colors }  = useTheme();
  const router      = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const projects    = useAppStore((s) => s.projects);
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const dashboard   = useAppStore((s) => s.dashboard.client);

  // Laravel: Client/ProjectController filters WHERE client_id = user.id
  const myProjects  = projects.filter((p) => p.client.id === currentUser?.id);
  const s           = {
    totalProjects: dashboard?.stats?.totalProjects ?? myProjects.length,
    activeProjects: dashboard?.stats?.activeProjects ?? myProjects.filter((p) => p.status === 'in_progress').length,
    completedProjects: dashboard?.stats?.completedProjects ?? myProjects.filter((p) => p.status === 'done').length,
    avgProgress: dashboard?.stats?.avgProgress ?? (myProjects.length ? Math.round(myProjects.reduce((sum, p) => sum + p.progress, 0) / myProjects.length) : 0),
  };

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
    ]).start();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity, transform: [{ translateY: slideY }] }]}>
        <LinearGradient colors={[colors.heroGradientTop, 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>Hello,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{currentUser?.name} 👋</Text>
          </View>
          <Pressable
            style={[styles.notifBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/notifications')}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.notifDot, { backgroundColor: colors.danger }]}>
                <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* Project KPIs */}
      <View style={styles.kpiRow}>
        <KpiCard label="My Projects"  value={s.totalProjects}     icon="briefcase-outline"   color={colors.primary} bg={colors.primaryLight} onPress={() => router.push('/(tabs)/projects')} />
        <KpiCard label="In Progress"  value={s.activeProjects}    icon="time-outline"         color={colors.warning} bg={colors.warningLight} onPress={() => router.push('/(tabs)/projects')} />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard label="Completed"    value={s.completedProjects} icon="checkmark-circle-outline" color={colors.success} bg={colors.successLight} onPress={() => router.push('/(tabs)/projects')} />
        <KpiCard label="Avg. Progress" value={`${s.avgProgress}%`} icon="stats-chart-outline" color={colors.info}    bg={colors.infoLight} />
      </View>

      {/* Projects list */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Projects</Text>
          <Pressable onPress={() => router.push('/(tabs)/projects')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>View all →</Text>
          </Pressable>
        </View>
        {myProjects.slice(0, 4).map((p) => (
          <Pressable
            key={p.id}
            style={[styles.projectRow, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
            onPress={() => router.push(`/project/${p.id}`)}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                <Badge label={p.status} variant={p.status} size="sm" />
              </View>
              <ProgressBar value={p.progress} height={4} />
            </View>
            <Text style={[styles.projectPct, { color: colors.primary }]}>{p.progress}%</Text>
          </Pressable>
        ))}
      </View>

      {/* Note: clients are read-only */}
      <View style={[styles.clientNote, { backgroundColor: colors.infoLight }]}>
        <Ionicons name="eye-outline" size={14} color={colors.info} />
        <Text style={[styles.clientNoteText, { color: colors.info }]}>
          You have read-only access to your project updates.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function recordValue(item: object, key: string) {
  return (item as Record<string, unknown>)[key];
}

function activityKey(item: object, index: number) {
  return String(recordValue(item, 'id') ?? index);
}

function activityAction(item: object) {
  return String(recordValue(item, 'action') ?? recordValue(item, 'type') ?? 'activity');
}

function activityTarget(item: object) {
  return String(recordValue(item, 'target') ?? recordValue(item, 'description') ?? 'Workspace update');
}

function activityUser(item: object) {
  const user = recordValue(item, 'user');
  if (user && typeof user === 'object') {
    return String((user as Record<string, unknown>).name ?? 'System');
  }
  return 'System';
}

function activityTime(item: object) {
  return String(recordValue(item, 'timestamp') ?? recordValue(item, 'created_at') ?? new Date().toISOString());
}

function KpiCard({ label, value, icon, color, bg, onPress }: {
  label: string; value: number | string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string; bg: string; onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.kpiCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function ActivityRow({ action, target, user, time }: { action: string; target: string; user: string; time: string }) {
  const { colors } = useTheme();
  const h = Math.floor((Date.now() - new Date(time).getTime()) / 3_600_000);
  const ago = h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`;
  return (
    <View style={[styles.activityRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={1}>
          <Text style={{ fontWeight: Typography.bold }}>{user}</Text> · {target}
        </Text>
        <Text style={[styles.activityTime, { color: colors.textMuted }]}>{ago}</Text>
      </View>
      <View style={[styles.activityBadge, { backgroundColor: colors.surfaceContainer }]}>
        <Text style={[styles.activityBadgeText, { color: colors.textSecondary }]}>{action.replace(/_/g,' ')}</Text>
      </View>
    </View>
  );
}

function QuickBtn({ icon, label, color, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; color: string; onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <View style={[styles.quickBtnIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickBtnLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: Typography.sm },
  userName: { fontSize: Typography.xl, fontWeight: Typography.black },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  notifDotText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },

  kpiRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  kpiCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  kpiIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiValue: { fontSize: Typography.xl, fontWeight: Typography.black },
  kpiLabel: { fontSize: Typography.xs },

  card: { marginHorizontal: Spacing.base, marginBottom: Spacing.md, gap: Spacing.sm },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.bold },
  cardSub: { fontSize: Typography.xs },
  bigPct: { fontSize: Typography.xl, fontWeight: Typography.black },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  riskRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  riskPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  riskText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl, gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold },
  seeAll: { fontSize: Typography.sm, fontWeight: Typography.semibold },

  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 10, borderBottomWidth: 1 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { fontSize: Typography.sm },
  activityTime: { fontSize: Typography.xs },
  activityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  activityBadgeText: { fontSize: 10, textTransform: 'capitalize' },

  projectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm },
  projectName: { fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: 4 },
  projectPct: { fontSize: Typography.sm, fontWeight: Typography.bold },
  emptyText: { textAlign: 'center', fontSize: Typography.sm, paddingVertical: Spacing.md },

  quickActions: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  quickRow: { flexDirection: 'row', gap: Spacing.md },
  quickBtn: { flex: 1, alignItems: 'center', gap: 6 },
  quickBtnIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickBtnLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  clientNote: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing.base, padding: Spacing.md, borderRadius: Radius.md },
  clientNoteText: { flex: 1, fontSize: Typography.xs },
});
