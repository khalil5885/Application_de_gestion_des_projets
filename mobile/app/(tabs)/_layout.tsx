/**
 * Tab Layout
 * 5-tab bottom navigation. Theme-aware.
 * Notification badge on Profile tab when there are unread notifications.
 */

import React from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { Typography } from '../../constants/theme';

function TabIcon({
  name,
  focused,
  color,
  size,
  badge,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  color: string;
  size: number;
  badge?: number;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
      <Ionicons name={name} size={size} color={color} />
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          {/* Only show number if > 1 to keep icon clean */}
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const isLoggedIn  = useAppStore((s) => s.isLoggedIn);
  const isHydratingAuth = useAppStore((s) => s.isHydratingAuth);
  const currentUser = useAppStore((s) => s.currentUser);
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const canSeeTeam  = currentUser?.global_role !== 'client';

  if (isHydratingAuth) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.semibold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={focused ? 'folder' : 'folder-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          href: canSeeTeam ? undefined : null,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#F87171', fontSize: 9 },
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapperFocused: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F87171',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
