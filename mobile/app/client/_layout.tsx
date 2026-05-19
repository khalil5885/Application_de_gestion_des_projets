import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAppStore } from '../../store/useAppStore';

export default function ClientLayout() {
  const role = useAppStore((s) => s.currentUser?.global_role);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hydrating = useAppStore((s) => s.isHydratingAuth);

  if (!hydrating && !isLoggedIn) return <Redirect href="/login" />;
  if (!hydrating && role !== 'client') return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="project/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
