import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, ...Shadow.sm, shadowColor: colors.shadowColor }]}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={isDark ? colors.primary : '#FFFFFF'} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.black },
  card: { margin: Spacing.base, borderRadius: Radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  rowIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold },
});
