import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/useAppStore';
import { Priority, TaskStatus } from '../../../types';
import { Radius, Spacing, Typography } from '../../../constants/theme';

const priorities: Priority[] = ['low', 'medium', 'high'];
const statuses: TaskStatus[] = ['todo', 'in_progress'];

export default function CreateTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const users = useAppStore((s) => s.users);
  const addTask = useAppStore((s) => s.addTask);
  const employees = users.filter((user) => user.global_role === 'employee');
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? 0);
  const [assigneeId, setAssigneeId] = useState(employees[0]?.id ?? 0);
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const submit = async () => {
    if (!title.trim() || !projectId) return;
    await addTask({
      title: title.trim(),
      projectId,
      priority,
      status,
      progress: status === 'in_progress' ? 50 : 0,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      assignee: employees.find((user) => user.id === assigneeId),
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>New Task</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <Selector label="Project" items={projects.map((p) => ({ id: p.id, label: p.name }))} value={projectId} onChange={setProjectId} />
        <Selector label="Assignee" items={employees.map((u) => ({ id: u.id, label: u.name }))} value={assigneeId} onChange={setAssigneeId} />
        <StringSelector label="Priority" items={priorities} value={priority} onChange={setPriority} />
        <StringSelector label="Status" items={statuses} value={status} onChange={setStatus} />
        <Pressable onPress={submit} style={[styles.submit, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Create Task</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Selector(props: { label: string; items: { id: number; label: string }[]; value: number; onChange: (id: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{props.label}</Text>
      <View style={styles.pills}>
        {props.items.map((item) => {
          const active = props.value === item.id;
          return <Pressable key={item.id} onPress={() => props.onChange(item.id)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}><Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>{item.label}</Text></Pressable>;
        })}
      </View>
    </View>
  );
}

function StringSelector<T extends string>(props: { label: string; items: T[]; value: T; onChange: (value: T) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{props.label}</Text>
      <View style={styles.pills}>
        {props.items.map((item) => {
          const active = props.value === item;
          return <Pressable key={item} onPress={() => props.onChange(item)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}><Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>{item.replace(/_/g, ' ')}</Text></Pressable>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  content: { padding: Spacing.base, gap: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  submit: { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md },
  submitText: { color: '#FFFFFF', fontWeight: Typography.bold },
});
