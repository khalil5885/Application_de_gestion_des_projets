/**
 * Root Layout
 * - GestureHandlerRootView + SafeAreaProvider
 * - Registers app routes only
 * - Route-level redirects handle auth after mount
 */

import React, { useEffect, useRef } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '../store/useAppStore';
import { appStorage } from '../services/storage';

export default function RootLayout() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const hydrateAuth = useAppStore((s) => s.hydrateAuth);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const bootstrapRoleData = useAppStore((s) => s.bootstrapRoleData);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const clearStaleUrl = async () => {
      const stored = await appStorage.getItem('pm_api_base_url');
      if (stored && (stored.includes('192.168.') || stored.includes('10.0.2.'))) {
        await appStorage.removeItem('pm_api_base_url');
        console.log('[startup] Cleared stale LAN URL:', stored);
      }
    };
    clearStaleUrl();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isLoggedIn) {
        void bootstrapRoleData();
      }
    });

    return () => subscription.remove();
  }, [bootstrapRoleData, isLoggedIn]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="api-settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="setup-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="project/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="task/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="notifications"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="employee" options={{ headerShown: false }} />
          <Stack.Screen name="client" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
