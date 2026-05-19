import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/index';
import { Radius, Shadow, Spacing, Typography } from '../../constants/theme';
import { User } from '../../types';

type MemberStats = { totalTasks: number; doneTasks: number; projects: number; completionPct: number };

export default function TeamScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const fetchUsers = useAppStore((s) => s.fetchUsers);
  const fetchTasks = useAppStore((s) => s.fetchTasks);
  const fetchProjects = useAppStore((s) => s.fetchProjects);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = currentUser?.global_role === 'admin';
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [headerOpacity]);

  const teamUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((user) => user.global_role !== 'client')
      .filter((user) => roleFilter === 'all' || user.global_role === roleFilter)
      .filter((user) => !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q));
  }, [roleFilter, search, users]);

  const stats = useMemo(
    () => teamUsers.map((user) => {
      const userTasks = tasks.filter((task) => task.assignee?.id === user.id);
      const doneTasks = userTasks.filter((task) => task.status === 'done').length;
      const projectCount = projects.filter((project) => project.members.some((member) => member.id === user.id)).length;
      return {
        userId: user.id,
        totalTasks: userTasks.length,
        doneTasks,
        projects: projectCount,
        completionPct: userTasks.length ? Math.round((doneTasks / userTasks.length) * 100) : 0,
      };
    }),
    [projects, tasks, teamUsers]
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([isAdmin ? fetchUsers() : Promise.resolve(), fetchProjects(), fetchTasks()]);
    setRefreshing(false);
  };

  if (currentUser?.global_role === 'client') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.lockedSection}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.lockedTitle, { color: colors.text }]}>Team not available</Text>
          <Text style={[styles.lockedSub, { color: colors.textMuted }]}>
            Team management is available to administrators and employees.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <LinearGradient colors={[colors.heroGradientTop, colors.background]} style={StyleSheet.absoluteFill} />
          <Text style={[styles.title, { color: colors.text }]}>Team</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{teamUsers.length} members tracked</Text>

          <View style={styles.overviewRow}>
            <OverviewStat icon="people-outline" label="Members" value={teamUsers.length} color={colors.primary} bg={colors.primaryLight} />
            <OverviewStat icon="briefcase-outline" label="Projects" value={projects.length} color={colors.success} bg={colors.successLight} />
            <OverviewStat icon="checkmark-done-outline" label="Done" value={tasks.filter((task) => task.status === 'done').length} color={colors.warning} bg={colors.warningLight} />
          </View>
        </Animated.View>

        <View style={styles.tools}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search employees"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleFilters}>
            {(['all', 'admin', 'employee'] as const).map((role) => {
              const active = roleFilter === role;
              return (
                <Pressable key={role} onPress={() => setRoleFilter(role)} style={[styles.roleFilter, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}>
                  <Text style={[styles.roleFilterText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                    {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.list}>
          {teamUsers.map((user, index) => (
            <AnimatedMemberCard
              key={user.id}
              user={user}
              stats={stats.find((item) => item.userId === user.id) ?? { totalTasks: 0, doneTasks: 0, projects: 0, completionPct: 0 }}
              index={index}
            />
          ))}
          {teamUsers.length === 0 && (
            <View style={[styles.emptySection, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No team members match your filters.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {isAdmin && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={() => router.push('/admin/create-user')}
          hitSlop={8}
        >
          <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function OverviewStat({ icon, label, value, color, bg }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: number; color: string; bg: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.overviewStat, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
      <View style={[styles.overviewIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.overviewValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function AnimatedMemberCard({ user, stats, index }: { user: User; stats: MemberStats; index: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 60, useNativeDriver: true, damping: 18, stiffness: 200 }),
    ]).start();
  }, [index, opacity, translateY]);

  const roleColor = user.global_role === 'admin' ? colors.primary : colors.success;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card style={styles.memberCard}>
        <View style={styles.memberTop}>
          <View style={styles.memberIdentity}>
            <Avatar name={user.name} color={user.color} size={48} />
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: colors.text }]}>{user.name}</Text>
              <Text style={[styles.memberEmail, { color: colors.textMuted }]}>{user.email}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '18', borderColor: roleColor + '30' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{user.global_role}</Text>
          </View>
        </View>

        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <MemberStat label="Projects" value={stats.projects} color={colors.primary} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <MemberStat label="Tasks" value={stats.totalTasks} color={colors.textSecondary} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <MemberStat label="Done" value={`${stats.completionPct}%`} color={colors.success} />
        </View>

        <View style={[styles.completionTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
          <View style={[styles.completionFill, { backgroundColor: user.color, width: `${stats.completionPct}%` }]} />
        </View>
      </Card>
    </Animated.View>
  );
}

function MemberStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.memberStat}>
      <Text style={[styles.memberStatValue, { color }]}>{value}</Text>
      <Text style={[styles.memberStatLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.xl, overflow: 'hidden', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  subtitle: { fontSize: Typography.sm },
  overviewRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  overviewStat: { flex: 1, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  overviewIcon: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: Typography.lg, fontWeight: Typography.black },
  overviewLabel: { fontSize: Typography.xs, textAlign: 'center' },
  tools: { paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 44 },
  searchInput: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
  roleFilters: { gap: Spacing.sm },
  roleFilter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  roleFilterText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  list: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  memberCard: { gap: Spacing.md },
  memberTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  memberIdentity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  memberInfo: { gap: 2, flex: 1 },
  memberName: { fontSize: Typography.base, fontWeight: Typography.semibold },
  memberEmail: { fontSize: Typography.xs },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  roleText: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: Spacing.md, alignItems: 'center' },
  memberStat: { flex: 1, alignItems: 'center', gap: 2 },
  memberStatValue: { fontSize: Typography.lg, fontWeight: Typography.black },
  memberStatLabel: { fontSize: Typography.xs },
  statDivider: { width: 1, height: 32 },
  completionTrack: { height: 3, borderRadius: Radius.full, overflow: 'hidden' },
  completionFill: { height: 3, borderRadius: Radius.full },
  emptySection: { borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center' },
  emptyText: { fontSize: Typography.sm },
  lockedSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  lockedTitle: { fontSize: Typography.xl, fontWeight: Typography.black },
  lockedSub: { textAlign: 'center', fontSize: Typography.sm, lineHeight: 20 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
});
