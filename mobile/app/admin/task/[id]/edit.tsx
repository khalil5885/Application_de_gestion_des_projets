import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../../../../hooks/useTheme';
import { useAppStore } from '../../../../store/useAppStore';
import { TaskStatus } from '../../../../types';
import { Radius, Spacing, Typography } from '../../../../constants/theme';

const statuses: TaskStatus[] = ['todo', 'in_progress', 'ready_for_review', 'done', 'on_hold'];

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const task = findTask(tasks, Number(id));
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');

  if (!task) return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><Text style={{ color: colors.textMuted, padding: Spacing.base }}>Task not found.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Task</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
        <View style={styles.pills}>
          {statuses.map((item) => {
            const active = status === item;
            return <Pressable key={item} onPress={() => setStatus(item)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}><Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>{item.replace(/_/g, ' ')}</Text></Pressable>;
          })}
        </View>
        <Pressable onPress={async () => { await updateTaskStatus(task.id, status); router.back(); }} style={[styles.submit, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Save Status</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function findTask(tasks: { id: number; subtasks?: any[] }[], id: number): any {
  for (const task of tasks) {
    if (task.id === id) return task;
    const child = findTask(task.subtasks ?? [], id);
    if (child) return child;
  }
  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  content: { padding: Spacing.base, gap: Spacing.md },
  taskTitle: { fontSize: Typography.lg, fontWeight: Typography.bold },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  submit: { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md },
  submitText: { color: '#FFFFFF', fontWeight: Typography.bold },
});
