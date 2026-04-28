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
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api'
import { colors, spacing, radius, font, cardStyle } from '../theme'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
]

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([])
  const [projectTypes, setProjectTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Fetch project types once for the type filter
  useEffect(() => {
    api.get('/api/admin/project-types')
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || []
        setProjectTypes([{ id: '', name: 'All Types' }, ...data])
      })
      .catch(() => {})
  }, [])

  const fetchProjects = useCallback(async () => {
    setError(null)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.project_type_id = typeFilter

      const res = await api.get('/api/admin/projects', { params })
      const data = res.data?.data?.data || res.data?.data || []
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    setLoading(true)
    fetchProjects()
  }, [fetchProjects])

  const onRefresh = () => { setRefreshing(true); fetchProjects() }

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const renderProject = ({ item }) => (
    <View style={styles.projectCard}>
      <View style={styles.cardTop}>
        <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
        <StatusBadge status={item.status} />
      </View>
      {item.client && (
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{item.client.name}</Text>
        </View>
      )}
      {item.project_type && (
        <View style={styles.metaRow}>
          <Ionicons name="tag-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{item.project_type.name}</Text>
        </View>
      )}
      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(item.start_date)} → {formatDate(item.end_date)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{item.members?.length ?? 0} members</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or client…"
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

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, statusFilter === opt.value && styles.chipActive]}
            onPress={() => setStatusFilter(opt.value)}
          >
            <Text style={[styles.chipText, statusFilter === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Type filter chips */}
      {projectTypes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, { marginTop: 0, paddingTop: 0 }]}>
          {projectTypes.map((t) => (
            <TouchableOpacity
              key={String(t.id)}
              style={[styles.chip, styles.chipSm, typeFilter === String(t.id) && styles.chipActive]}
              onPress={() => setTypeFilter(String(t.id))}
            >
              <Text style={[styles.chipText, typeFilter === String(t.id) && styles.chipTextActive, { fontSize: 11 }]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProjects}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProject}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {search || statusFilter || typeFilter ? 'No projects match your filters.' : 'No projects yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

function StatusBadge({ status }) {
  const color = colors[status] || colors.textSecondary
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{status?.replace('_', ' ')}</Text>
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
  countBadge: { backgroundColor: colors.primary + '33', paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.full },
  countText: { color: colors.primary, ...font.semibold, fontSize: 13 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, paddingVertical: 10 },
  chipsRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.xs, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  chipSm: { paddingVertical: 4 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12, ...font.medium },
  chipTextActive: { color: colors.white },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  projectCard: { ...cardStyle, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  projectName: { ...font.semibold, fontSize: 15, color: colors.textPrimary, flex: 1, marginRight: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textSecondary, fontSize: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  badgeText: { fontSize: 11, ...font.medium, textTransform: 'capitalize' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.sm },
  retryText: { color: colors.white, ...font.medium },
})
