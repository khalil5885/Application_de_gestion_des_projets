import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme'
import DashboardScreen from '../screens/DashboardScreen'
import ProjectsScreen from '../screens/ProjectsScreen'
import UsersScreen from '../screens/UsersScreen'

const Tab = createBottomTabNavigator()

const tabIcon = (name) => ({ color, size }) =>
  <Ionicons name={name} color={color} size={size} />

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: tabIcon('grid-outline'), tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{ tabBarIcon: tabIcon('folder-outline'), tabBarLabel: 'Projects' }}
      />
      <Tab.Screen
        name="Users"
        component={UsersScreen}
        options={{ tabBarIcon: tabIcon('people-outline'), tabBarLabel: 'Users' }}
      />
    </Tab.Navigator>
  )
}
