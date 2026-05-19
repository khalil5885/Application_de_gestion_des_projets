import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Radius, Spacing, Typography } from '../../constants/theme';

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <TextInput placeholder="New password" placeholderTextColor={colors.textMuted} secureTextEntry style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceContainer }]} />
        <Pressable onPress={() => router.back()} style={[styles.submit, { backgroundColor: colors.primary }]}>
          <Text style={styles.submitText}>Save Profile</Text>
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
  submit: { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md },
  submitText: { color: '#FFFFFF', fontWeight: Typography.bold },
});
