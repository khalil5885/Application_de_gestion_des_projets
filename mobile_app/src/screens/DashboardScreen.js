import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { colors, spacing, radius, font, cardStyle } from '../theme'

const STATUS_COUNT_KEYS = ['pending', 'in_progress', 'completed', 'on_hold']

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({ projects: 0, users: 0, statusCounts: {} })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        api.get('/api/admin/projects'),
        api.get('/api/admin/users'),
      ])

      const projects = projRes.data?.data?.data || projRes.data?.data || []
      const users = userRes.data?.data?.data || userRes.data?.data || []

      // Count by status
      const statusCounts = {}
      STATUS_COUNT_KEYS.forEach((k) => { statusCounts[k] = 0 })
      projects.forEach((p) => { if (p.status) statusCounts[p.status] = (statusCounts[p.status] || 0) + 1 })

      setStats({ projects: projects.length, users: users.length, statusCounts })
    } catch (e) {
      console.warn('Dashboard fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const onRefresh = () => { setRefreshing(true); fetchStats() }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>{user?.global_role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Top stat cards */}
            <View style={styles.row}>
              <StatCard icon="folder" label="Total Projects" value={stats.projects} color={colors.primary} />
              <StatCard icon="people" label="Total Users" value={stats.users} color={colors.success} />
            </View>

            {/* Section: Projects by status */}
            <Text style={styles.sectionTitle}>Projects by Status</Text>
            <View style={styles.statusGrid}>
              {STATUS_COUNT_KEYS.map((key) => (
                <View key={key} style={[styles.statusCard, { borderLeftColor: colors[key] }]}>
                  <Text style={[styles.statusCount, { color: colors[key] }]}>{stats.statusCounts[key] ?? 0}</Text>
                  <Text style={styles.statusLabel}>{key.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>

            {/* Account info */}
            <Text style={styles.sectionTitle}>Your Account</Text>
            <View style={cardStyle}>
              <InfoRow icon="person-outline" label="Name" value={user?.name} />
              <InfoRow icon="mail-outline" label="Email" value={user?.email} />
              <InfoRow icon="shield-outline" label="Role" value={user?.global_role} last />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  greeting: { ...font.bold, fontSize: 20, color: colors.textPrimary },
  role: { color: colors.textSecondary, fontSize: 13, textTransform: 'capitalize', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#2d1215', borderRadius: radius.sm },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1, ...cardStyle, alignItems: 'center', paddingVertical: spacing.lg, gap: 6,
  },
  statValue: { ...font.bold, fontSize: 32 },
  statLabel: { color: colors.textSecondary, fontSize: 12 },
  sectionTitle: { ...font.semibold, color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statusCard: {
    flex: 1, minWidth: '44%', backgroundColor: colors.card, borderRadius: radius.sm,
    borderLeftWidth: 4, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  statusCount: { ...font.bold, fontSize: 24 },
  statusLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  infoLabel: { color: colors.textSecondary, fontSize: 13, width: 60 },
  infoValue: { ...font.medium, color: colors.textPrimary, fontSize: 14, flex: 1, textAlign: 'right', textTransform: 'capitalize' },
})
