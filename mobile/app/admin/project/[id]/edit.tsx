import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../../../../hooks/useTheme';
import { useAppStore } from '../../../../store/useAppStore';
import { Radius, Spacing, Typography } from '../../../../constants/theme';
import { ProjectStatus } from '../../../../types';

const statuses: ProjectStatus[] = ['todo', 'in_progress', 'ready_for_review', 'done', 'on_hold'];

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const project = useAppStore((s) => s.projects.find((item) => item.id === Number(id)));
  const updateProject = useAppStore((s) => s.updateProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'todo');

  if (!project) return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}><Text style={{ color: colors.textMuted, padding: Spacing.base }}>Project not found.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Project</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput value={name} onChangeText={setName} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <TextInput value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <View style={styles.pills}>
          {statuses.map((item) => {
            const active = status === item;
            return (
              <Pressable key={item} onPress={() => setStatus(item)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}>
                <Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>{item.replace(/_/g, ' ')}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={async () => { await updateProject(project.id, { name, description, status }); router.back(); }} style={[styles.submit, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Save Changes</Text>
        </Pressable>
        <Pressable onPress={async () => { await deleteProject(project.id); router.replace('/(tabs)/projects'); }} style={[styles.submit, { backgroundColor: colors.danger }]}>
          <Text style={styles.submitText}>Delete Project</Text>
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
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  submit: { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md },
  submitText: { color: '#FFFFFF', fontWeight: Typography.bold },
});
