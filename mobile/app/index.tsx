import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';

export default function IndexScreen() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const isHydratingAuth = useAppStore((s) => s.isHydratingAuth);
  const role = useAppStore((s) => s.currentUser?.global_role);
  const { colors } = useTheme();

  if (isHydratingAuth) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) return <Redirect href="/login" />;
  if (role === 'admin') return <Redirect href="/admin/dashboard" />;
  if (role === 'client') return <Redirect href="/client/dashboard" />;
  return <Redirect href="/employee/dashboard" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
