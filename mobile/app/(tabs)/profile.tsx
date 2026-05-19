/**
 * Profile Screen
 * - Current user info and stats
 * - My Requests
 * - Preferences (dark mode, notifications, language, about)
 * - Admin section (create user — admin only)
 * - Sign Out (wired to store logout + redirect to login)
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Card } from '../../components/ui/Card';
import { Avatar, Badge } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { RequestStatus } from '../../types';

function requestBadgeVariant(status: RequestStatus) {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const router             = useRouter();
  const currentUser        = useAppStore((s) => s.currentUser);
  const toggleTheme        = useAppStore((s) => s.toggleTheme);
  const logout             = useAppStore((s) => s.logout);
  const tasks              = useAppStore((s) => s.tasks);
  const projects           = useAppStore((s) => s.projects);
  const requests           = useAppStore((s) => s.requests);
  const isAdmin            = currentUser?.global_role === 'admin';

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
    ]).start();
  }, []);

  // Null-safe: currentUser is User|null after auth refactor
  const userId      = currentUser?.id ?? -1;
  const userTasks   = currentUser?.global_role === 'admin' ? tasks : tasks.filter((t) => t.assignee?.id === userId);
  const userProjects= currentUser?.global_role === 'client'
    ? projects.filter((p) => p.client.id === userId)
    : currentUser?.global_role === 'admin'
    ? projects
    : projects.filter((p) => p.members.some((m) => m.id === userId));
  const doneTasks   = userTasks.filter((t) => t.status === 'done').length;
  const myRequests  = requests.filter((r) => r.requestedBy.id === userId);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  const handleCreateUser = () => {
    router.push('/admin/create-user');
  };

  const handleAbout = () => {
    Alert.alert(
      'About ProjectManager',
      'ProjectManager v1.0.0\nExpo SDK 54 · React Native\n\nA professional project management app built for enterprise teams.\n\nDeveloped for PFE presentation.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Profile hero ── */}
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <View style={[styles.heroCard, { ...Shadow.md, shadowColor: colors.shadowColor, overflow: 'hidden' }]}>
            <LinearGradient
              colors={[colors.heroGradientTop, colors.card]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroInner}>
              <View style={styles.avatarWrapper}>
                <Avatar name={currentUser?.name ?? 'User'} color={currentUser?.color ?? colors.primary} size={72} />
                <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />
              </View>
              <Text style={[styles.heroName, { color: colors.text }]}>{currentUser?.name ?? 'User'}</Text>
              <Text style={[styles.heroEmail, { color: colors.textMuted }]}>{currentUser?.email ?? ''}</Text>
              <View style={[styles.heroRoleBadge, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.heroRoleText, { color: colors.primary }]}>
                  {(currentUser?.global_role ?? 'user').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Quick stats */}
            <View style={[styles.heroStats, { borderTopColor: colors.border }]}>
              <HeroStat label="Projects" value={userProjects.length} />
              <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
              <HeroStat label="Tasks" value={userTasks.length} />
              <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
              <HeroStat label="Done" value={doneTasks} />
            </View>
          </View>
        </Animated.View>

        {/* ── Admin Section (admin only) ── */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin</Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
              <SettingRow
                icon="person-add-outline"
                label="Create User"
                color={colors.primary}
                bg={colors.primaryLight}
                showArrow
                onPress={handleCreateUser}
              />
              <SettingRow
                icon="people-outline"
                label="Manage Users"
                color={colors.info}
                bg={colors.infoLight}
                showArrow
                onPress={() => router.push('/admin/users')}
              />
              <SettingRow
                icon="document-text-outline"
                label="Requests"
                color={colors.warning}
                bg={colors.warningLight}
                showArrow
                onPress={() => router.push('/admin/requests')}
              />
              <SettingRow
                icon="stats-chart-outline"
                label="Team Workload"
                color={colors.success}
                bg={colors.successLight}
                showArrow
                onPress={() => router.push('/admin/workload')}
                isLast
              />
            </View>
          </View>
        )}

        {/* ── My Requests ── */}
        {myRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Requests</Text>
            {myRequests.map((req) => (
              <Card key={req.id} style={styles.requestCard} padding={Spacing.md}>
                <View style={styles.requestRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.requestTitle, { color: colors.text }]} numberOfLines={1}>
                      {req.title}
                    </Text>
                    <Text style={[styles.requestProject, { color: colors.textMuted }]}>
                      {req.project.name}
                    </Text>
                  </View>
                  <Badge label={req.status} variant={requestBadgeVariant(req.status)} size="sm" />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
            <SettingRow
              icon="create-outline"
              label="Edit Profile"
              color={colors.primary}
              bg={colors.primaryLight}
              showArrow
              onPress={() => router.push('/profile/edit' as never)}
            />
            <SettingRow
              icon="settings-outline"
              label="Settings"
              color={colors.info}
              bg={colors.infoLight}
              showArrow
              onPress={() => router.push('/settings' as never)}
            />
            {/* Dark mode toggle */}
            <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={isDark ? colors.primary : '#FFFFFF'}
              />
            </View>

            <SettingRow
              icon="notifications-outline"
              label="Notifications"
              color={colors.warning}
              bg={colors.warningLight}
              showArrow
              onPress={handleNotifications}
            />
            {currentUser?.global_role === 'employee' && (
              <SettingRow
                icon="document-text-outline"
                label="My Requests"
                color={colors.info}
                bg={colors.infoLight}
                showArrow
                onPress={() => router.push('/employee/requests')}
              />
            )}
            {currentUser?.global_role === 'client' && (
              <SettingRow
                icon="folder-outline"
                label="My Projects"
                color={colors.primary}
                bg={colors.primaryLight}
                showArrow
                onPress={() => router.push('/(tabs)/projects')}
              />
            )}
            <SettingRow
              icon="language-outline"
              label="Language"
              color={colors.success}
              bg={colors.successLight}
              value="English"
            />
            <SettingRow
              icon="information-circle-outline"
              label="About"
              color={colors.info}
              bg={colors.infoLight}
              showArrow
              onPress={handleAbout}
              isLast
            />
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
            <SettingRow
              icon="log-out-outline"
              label="Sign Out"
              color={colors.danger}
              bg={colors.dangerLight}
              onPress={handleSignOut}
              isLast
            />
          </View>
        </View>

        <Text style={[styles.version, { color: colors.textMuted }]}>
          ProjectManager v1.0.0 · Expo SDK 54
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── HeroStat ─────────────────────────────────────────────────────────────────

function HeroStat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.heroStat}>
      <Text style={[styles.heroStatValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────

function SettingRow({
  icon, label, value, color, bg, showArrow, isLast, onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  color: string;
  bg: string;
  showArrow?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.textMuted }]}>{value}</Text>}
        {showArrow && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  heroCard: { margin: Spacing.base, borderRadius: Radius.xl },
  heroInner: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  avatarWrapper: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  heroName: { fontSize: Typography.xl, fontWeight: Typography.black },
  heroEmail: { fontSize: Typography.sm },
  heroRoleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, marginTop: 4 },
  heroRoleText: { fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 1.5 },

  heroStats: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: Spacing.md },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: Typography.xl, fontWeight: Typography.black },
  heroStatLabel: { fontSize: Typography.xs },
  heroStatDivider: { width: 1, height: 36 },

  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl, gap: Spacing.md },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold },

  requestCard: { marginBottom: Spacing.sm },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md },
  requestTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  requestProject: { fontSize: Typography.xs, marginTop: 2 },

  settingsCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: Typography.base },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: Typography.sm },

  version: { textAlign: 'center', fontSize: Typography.xs, paddingBottom: Spacing.xl },
});
