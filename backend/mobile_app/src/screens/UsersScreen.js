import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api'
import { colors, spacing, radius, font, cardStyle } from '../theme'

const ROLE_COLORS = { admin: colors.admin, employee: colors.employee, client: colors.client }

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsersScreen() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    setError(null)
    try {
      const res = await api.get('/api/admin/users')
      const data = res.data?.data?.data || res.data?.data || []
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const onRefresh = () => { setRefreshing(true); fetchUsers() }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const renderUser = ({ item, index }) => {
    const roleColor = ROLE_COLORS[item.global_role] || colors.textSecondary
    const initials = item.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    return (
      <View style={styles.userCard}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: roleColor + '33', borderColor: roleColor }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
        </View>
        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userDate}>Joined {formatDate(item.created_at)}</Text>
        </View>
        {/* Role badge */}
        <View style={[styles.roleBadge, { borderColor: roleColor, backgroundColor: roleColor + '22' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{item.global_role}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        {!loading && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUsers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {search ? `No users match "${search}"` : 'No users found.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...font.bold, fontSize: 22, color: colors.textPrimary },
  countBadge: { backgroundColor: colors.success + '33', paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.full },
  countText: { color: colors.success, ...font.semibold, fontSize: 13 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, margin: spacing.lg, marginBottom: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, paddingVertical: 10 },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: 40 },
  userCard: { ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...font.bold, fontSize: 15 },
  userInfo: { flex: 1 },
  userName: { ...font.semibold, color: colors.textPrimary, fontSize: 14 },
  userEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  userDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  roleText: { ...font.medium, fontSize: 11, textTransform: 'capitalize' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.sm },
  retryText: { color: colors.white, ...font.medium },
})
