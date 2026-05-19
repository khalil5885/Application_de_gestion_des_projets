import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../../hooks/useTheme';
import { useAppStore } from '../../../store/useAppStore';
import { Radius, Spacing, Typography } from '../../../constants/theme';

export default function CreateProjectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const users = useAppStore((s) => s.users);
  const addProject = useAppStore((s) => s.addProject);
  const clients = users.filter((user) => user.global_role === 'client');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id ?? 0);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    const client = clients.find((item) => item.id === clientId) ?? clients[0];
    if (!client) {
      setError('Create a client user before creating a project.');
      return;
    }
    await addProject({
      name: name.trim(),
      description: description.trim(),
      client,
      status: 'todo',
      progress: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      members: [],
      tasks: [],
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>New Project</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Project name" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Project details" multiline />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Client</Text>
        <View style={styles.pills}>
          {clients.map((client) => {
            const active = clientId === client.id;
            return (
              <Pressable key={client.id} onPress={() => setClientId(client.id)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceContainer }]}>
                <Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>{client.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        <Pressable onPress={submit} style={[styles.submit, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Create Project</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: { label: string; value: string; placeholder: string; multiline?: boolean; onChangeText: (value: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={props.multiline}
        style={[styles.input, props.multiline && styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]}
      />
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
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  error: { fontSize: Typography.sm },
  submit: { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md, marginTop: Spacing.sm },
  submitText: { color: '#FFFFFF', fontWeight: Typography.bold },
});
