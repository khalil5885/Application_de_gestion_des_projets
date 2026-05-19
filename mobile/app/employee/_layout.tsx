import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAppStore } from '../../store/useAppStore';

export default function EmployeeLayout() {
  const role = useAppStore((s) => s.currentUser?.global_role);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hydrating = useAppStore((s) => s.isHydratingAuth);

  if (!hydrating && !isLoggedIn) return <Redirect href="/login" />;
  if (!hydrating && role !== 'employee') return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen
        name="requests"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="task/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
