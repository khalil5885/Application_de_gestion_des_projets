import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { Radius, Spacing, Typography } from '../constants/theme';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const query = useAppStore((s) => s.search.query);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const q = query.trim().toLowerCase();
  const results = useMemo(() => ({
    projects: projects.filter((item) => q && item.name.toLowerCase().includes(q)).slice(0, 10),
    tasks: tasks.filter((item) => q && item.title.toLowerCase().includes(q)).slice(0, 10),
    users: users.filter((item) => q && (item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q))).slice(0, 10),
  }), [projects, q, tasks, users]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput value={query} onChangeText={setSearchQuery} autoFocus placeholder="Search projects, tasks, users" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text }]} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {results.projects.map((project) => <Row key={`p-${project.id}`} label={project.name} icon="folder-outline" onPress={() => router.push(`/project/${project.id}`)} />)}
        {results.tasks.map((task) => <Row key={`t-${task.id}`} label={task.title} icon="checkmark-circle-outline" onPress={() => router.push(`/task/${task.id}`)} />)}
        {results.users.map((user) => <Row key={`u-${user.id}`} label={user.name} icon="person-outline" onPress={() => router.push(`/admin/user/${user.id}` as never)} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row(props: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={props.onPress} style={[styles.result, { backgroundColor: colors.card }]}>
      <Ionicons name={props.icon} size={18} color={colors.primary} />
      <Text style={[styles.resultText, { color: colors.text }]}>{props.label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md },
  input: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
  content: { padding: Spacing.base, gap: Spacing.sm },
  result: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md },
  resultText: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold },
});
