import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAppStore } from '../../store/useAppStore';

export default function AdminLayout() {
  const role = useAppStore((s) => s.currentUser?.global_role);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hydrating = useAppStore((s) => s.isHydratingAuth);

  if (!hydrating && !isLoggedIn) return <Redirect href="/login" />;
  if (!hydrating && role !== 'admin') return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen
        name="create-user"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="users" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="requests" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="workload" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="workload/[userId]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="projects" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="tasks" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="project/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="task/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="user/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="project/[id]/edit" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="task/[id]/edit" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
