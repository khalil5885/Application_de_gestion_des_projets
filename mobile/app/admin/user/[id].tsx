import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/useAppStore';
import { Radius, Spacing, Typography } from '../../../constants/theme';
import { UserRole } from '../../../types';

const roles: UserRole[] = ['admin', 'employee', 'client'];

export default function UserEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAppStore((s) => s.users.find((item) => item.id === Number(id)));
  const updateUser = useAppStore((s) => s.updateUser);
  const deleteUser = useAppStore((s) => s.deleteUser);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<UserRole>(user?.global_role ?? 'employee');

  if (!user) return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><Text style={{ color: colors.textMuted, padding: Spacing.base }}>User not found.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>User Detail</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput value={name} onChangeText={setName} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <View style={styles.pills}>
          {roles.map((item) => {
            const active = role === item;
            return <Pressable key={item} onPress={() => setRole(item)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}><Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>{item}</Text></Pressable>;
          })}
        </View>
        <Pressable onPress={async () => { await updateUser(user.id, { name, email, global_role: role }); router.back(); }} style={[styles.submit, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Save User</Text>
        </Pressable>
        <Pressable onPress={async () => { await deleteUser(user.id); router.replace('/admin/users'); }} style={[styles.submit, { backgroundColor: colors.danger }]}>
          <Text style={styles.submitText}>Delete User</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  content: { padding: Spacing.base, gap: Spacing.md },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  submit: { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md },
  submitText: { color: '#FFFFFF', fontWeight: Typography.bold },
});
