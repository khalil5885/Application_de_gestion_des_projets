/**
 * Admin: Users Management Screen
 * Mirrors Laravel Admin/UserController index.
 * Lists all users with role, status.
 * Admin can navigate to create-user or deactivate a user.
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
import { Avatar } from '../../components/ui/index';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { User, UserRole } from '../../types';

const ROLE_COLOR: Record<UserRole, string> = {
  admin:    '#6366F1',
  employee: '#34D399',
  client:   '#A78BFA',
};

const ROLE_FILTER: { key: 'all' | UserRole; label: string }[] = [
  { key: 'all',      label: 'All'       },
  { key: 'admin',    label: 'Admins'    },
  { key: 'employee', label: 'Employees' },
  { key: 'client',   label: 'Clients'   },
];

export default function AdminUsersScreen() {
  const { colors }    = useTheme();
  const router        = useRouter();
  const currentUser   = useAppStore((s) => s.currentUser);
  const users         = useAppStore((s) => s.users);
  const deleteUser    = useAppStore((s) => s.deleteUser);

  const [filter, setFilter] = useState<'all' | UserRole>('all');

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

  const filtered = filter === 'all' ? users : users.filter((u) => u.global_role === filter);

  const handleDelete = (user: User) => {
    if (user.id === currentUser.id) {
      Alert.alert('Error', 'You cannot delete your own account.');
      return;
    }
    Alert.alert(
      'Deactivate User',
      `Deactivate ${user.name}? They will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => deleteUser(user.id) },
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
          <Text style={[styles.title, { color: colors.text }]}>Users</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{users.length}</Text>
          </View>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/admin/create-user')}
          hitSlop={8}
        >
          <Ionicons name="person-add-outline" size={18} color="#FFF" />
        </Pressable>
      </Animated.View>

      {/* Role filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {ROLE_FILTER.map((f) => {
          const isActive = filter === f.key;
          const cnt = f.key === 'all' ? users.length : users.filter(u => u.global_role === f.key).length;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterPill, { backgroundColor: isActive ? colors.primary : colors.surfaceContainer }]}
            >
              <Text style={[styles.filterLabel, { color: isActive ? '#FFF' : colors.textSecondary }]}>{f.label}</Text>
              <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh }]}>
                <Text style={[styles.filterCountText, { color: isActive ? '#FFF' : colors.textMuted }]}>{cnt}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((user, i) => (
          <UserCard key={user.id} user={user} index={i} onDelete={() => handleDelete(user)} isSelf={user.id === currentUser.id} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserCard({ user, index, onDelete, isSelf }: { user: User; index: number; onDelete: () => void; isSelf: boolean }) {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 50, useNativeDriver: true, damping: 22 }),
    ]).start();
  }, []);

  const roleColor = ROLE_COLOR[user.global_role];

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={[styles.card, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
        <Avatar name={user.name} color={user.color} size={48} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
            {isSelf && (
              <View style={[styles.selfTag, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.selfTagText, { color: colors.primary }]}>You</Text>
              </View>
            )}
          </View>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user.email}</Text>
          <View style={[styles.rolePill, { backgroundColor: roleColor + '18' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{user.global_role}</Text>
          </View>
        </View>
        {!isSelf && (
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="person-remove-outline" size={16} color={colors.danger} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  guardText: { fontSize: Typography.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  backCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  countText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filters: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.sm, alignItems: 'center', height: 52 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, height: 36 },
  filterLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  filterCount: { minWidth: 20, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCountText: { fontSize: 10, fontWeight: Typography.bold },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 48, gap: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: Typography.base, fontWeight: Typography.bold },
  selfTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  selfTagText: { fontSize: 10, fontWeight: Typography.bold },
  email: { fontSize: Typography.xs, marginTop: 2 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6 },
  roleText: { fontSize: Typography.xs, fontWeight: Typography.black, textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});