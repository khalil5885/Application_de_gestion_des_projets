import React, { useEffect, useState, useMemo } from 'react'
import { 
  CCard, 
  CCardBody, 
  CBadge, 
  CSpinner,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CButton
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilHistory, 
  cilUser, 
  cilTask, 
  cilTrash, 
  cilPlus, 
  cilPencil,
  cilXCircle,
  cilCalendar,
  cilFilter,
  cilSearch,
  cilOptions
} from '@coreui/icons'
import { motion, AnimatePresence } from 'motion/react'
import api from '../../../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDescription = (description) => {
  const desc = description?.toLowerCase() || ''
  
  if (desc.includes('created') && desc.includes('project')) 
    return { color: '#22c55e', icon: cilPlus, bg: '#22c55e18', border: '#22c55e40', type: 'project' }
  if (desc.includes('created') && desc.includes('task')) 
    return { color: '#3b82f6', icon: cilTask, bg: '#3b82f618', border: '#3b82f640', type: 'task' }
  if (desc.includes('created') && desc.includes('template')) 
    return { color: '#3b82f6', icon: cilTask, bg: '#3b82f618', border: '#3b82f640', type: 'task' }
  if (desc.includes('created') && desc.includes('type')) 
    return { color: '#9333ea', icon: cilPlus, bg: '#9333ea18', border: '#9333ea40', type: 'project_type' }
  if (desc.includes('updated') && desc.includes('project')) 
    return { color: '#f59e0b', icon: cilPencil, bg: '#f59e0b18', border: '#f59e0b40', type: 'project' }
  if (desc.includes('updated') && desc.includes('task')) 
    return { color: '#f59e0b', icon: cilPencil, bg: '#f59e0b18', border: '#f59e0b40', type: 'task' }
  if (desc.includes('updated') && desc.includes('type')) 
    return { color: '#f59e0b', icon: cilPencil, bg: '#f59e0b18', border: '#f59e0b40', type: 'project_type' }
  if (desc.includes('deleted') || desc.includes('removed')) 
    return { color: '#e55353', icon: cilTrash, bg: '#e5535318', border: '#e5535340', type: 'delete' }
  if (desc.includes('assigned') && desc.includes('employee')) 
    return { color: '#5856d6', icon: cilUser, bg: '#5856d618', border: '#5856d640', type: 'assignment' }
  if (desc.includes('unassigned')) 
    return { color: '#e55353', icon: cilXCircle, bg: '#e5535318', border: '#e5535340', type: 'assignment' }
  if (desc.includes('seeded')) 
    return { color: '#6b7280', icon: cilHistory, bg: '#6b728018', border: '#6b728040', type: 'system' }
  
  return { color: '#6b7280', icon: cilHistory, bg: '#6b728018', border: '#6b728040', type: 'other' }
}

const formatTime = (dateStr) => {
  if (!dateStr) return '...'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

const formatProperties = (props) => {
  if (!props) return null
  const entries = Object.entries(props)
  if (entries.length === 0) return null
  return entries.map(([key, value]) => `${key}: ${value}`).join(', ')
}

const isWithinDateRange = (dateStr, range) => {
  if (!range || range === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  switch (range) {
    case 'today': return diff < 86400000 && date.getDate() === now.getDate()
    case 'week': return diff < 604800000
    case 'month': return diff < 2592000000
    case 'year': return diff < 31536000000
    default: return true
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const Activity = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    api.get('/api/admin/activity-logs')
      .then(res => {
        const items = res.data?.data?.items
        setLogs(Array.isArray(items) ? items : [])
      })
      .catch(() => setError('Failed to load activity logs.'))
      .finally(() => setLoading(false))
  }, [])

  // Extract unique roles from logs
  const uniqueRoles = useMemo(() => {
    const roles = new Set(logs.map(log => log.user?.global_role).filter(Boolean))
    return ['all', ...Array.from(roles)]
  }, [logs])

  // Activity type options
  const activityTypes = [
    { key: 'all', label: 'All Types' },
    { key: 'project', label: 'Project' },
    { key: 'task', label: 'Task' },
    { key: 'assignment', label: 'Assignment' },
    { key: 'delete', label: 'Delete' },
    { key: 'project_type', label: 'Project Type' },
    { key: 'system', label: 'System' },
    { key: 'other', label: 'Other' },
  ]

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const config = parseDescription(log.description)
      const matchesSearch = !searchQuery || 
        log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || log.user?.global_role === roleFilter
      const matchesDate = isWithinDateRange(log.created_at, dateFilter)
      const matchesType = typeFilter === 'all' || config.type === typeFilter
      
      return matchesSearch && matchesRole && matchesDate && matchesType
    })
  }, [logs, searchQuery, roleFilter, dateFilter, typeFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setDateFilter('all')
    setTypeFilter('all')
  }

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all'

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ 
            width: 42, height: 42, borderRadius: 13, 
            background: 'rgba(88,86,214,0.12)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <CIcon icon={cilHistory} style={{ color: '#5856d6', fontSize: 20 }} />
          </div>
          <div>
            <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.3px' }}>Activity</h4>
            <p className="text-body-secondary small mb-0">Recent actions across the platform.</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-4 d-flex flex-wrap align-items-center gap-3">
        {/* Search */}
        <CInputGroup style={{ maxWidth: '280px' }}>
          <CInputGroupText className="bg-transparent border-end-0">
            <CIcon icon={cilSearch} size="sm" />
          </CInputGroupText>
          <CFormInput 
            className="border-start-0 shadow-none"
            placeholder="Search activities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CInputGroup>

        {/* Role Filter */}
        <CFormSelect
          size="sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}
          className="shadow-none"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.filter(r => r !== 'all').map(role => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </CFormSelect>

        {/* Date Filter */}
        <CFormSelect
          size="sm"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}
          className="shadow-none"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </CFormSelect>

        {/* Type Filter */}
        <CFormSelect
          size="sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
          className="shadow-none"
        >
          {activityTypes.map(type => (
            <option key={type.key} value={type.key}>{type.label}</option>
          ))}
        </CFormSelect>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <CButton 
            color="light" 
            size="sm" 
            variant="outline"
            onClick={clearFilters}
            className="d-flex align-items-center gap-1"
          >
            <CIcon icon={cilXCircle} size="sm" />
            Clear
          </CButton>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-3 px-1">
        <span className="text-muted small">
          Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> activities
        </span>
      </div>

      <div style={{ maxWidth: 640 }}>
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>Recent Activity</span>
              {!loading && <CBadge color="secondary" shape="rounded-pill">{filteredLogs.length} events</CBadge>}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <CSpinner size="sm" variant="grow" /> 
                <div className="mt-2 text-body-secondary small">Fetching latest logs...</div>
              </div>
            )}

            {/* Error State */}
            {error && <p className="text-danger small text-center">{error}</p>}

            {/* Timeline */}
            {!loading && !error && (
              <div style={{ position: 'relative' }}>
                {/* Vertical Line */}
                {filteredLogs.length > 0 && (
                  <div style={{
                    position: 'absolute', left: 19, top: 0, bottom: 0,
                    width: 2, background: 'var(--cui-border-color-translucent)',
                  }} />
                )}

                <AnimatePresence mode="popLayout">
                  <div className="d-flex flex-column gap-4">
                    {filteredLogs.map((log, idx) => {
                      const config = parseDescription(log.description)
                      const actor = log.user?.name ?? 'System'
                      const actorRole = log.user?.global_role
                      const propsText = formatProperties(log.properties)

                      return (
                        <motion.div
                          key={log.id || idx}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                        >
                          {/* Icon Node */}
                          <div style={{
                            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                            background: config.bg,
                            border: `1.5px solid ${config.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1, position: 'relative',
                          }}>
                            <CIcon icon={config.icon} size="sm" style={{ color: config.color }} />
                          </div>

                          {/* Content Card */}
                          <div style={{
                            flex: 1, padding: '12px 16px', borderRadius: 12,
                            background: 'var(--cui-tertiary-bg)',
                            border: '1px solid var(--cui-border-color-translucent)',
                          }}>
                            {/* Main description line */}
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="fw-bold small">{actor}</span>
                              {actorRole && (
                                <CBadge color="light" textColor="secondary" shape="rounded-pill" className="small">
                                  {actorRole}
                                </CBadge>
                              )}
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.5 }} className="text-body-secondary">
                              {log.description}
                            </div>
                            
                            {/* Properties */}
                            {propsText && (
                              <div 
                                className="mt-2 small font-monospace" 
                                style={{ 
                                  color: 'var(--cui-secondary-color)', 
                                  fontSize: 11,
                                  background: 'rgba(0,0,0,0.03)',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  display: 'inline-block',
                                }}
                              >
                                {propsText}
                              </div>
                            )}
                            
                            {/* Timestamp */}
                            <div style={{ fontSize: 11, color: 'var(--cui-secondary-color)', marginTop: 8 }}>
                              <CIcon icon={cilCalendar} size="custom-size" height={10} className="me-1" />
                              {formatTime(log.created_at)}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </AnimatePresence>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-5">
                    <CIcon icon={cilFilter} size="xl" className="mb-2 opacity-25" />
                    <p className="text-body-secondary small mb-0">No activities match your filters.</p>
                    {hasActiveFilters && (
                      <CButton color="primary" size="sm" className="mt-2" onClick={clearFilters}>
                        Clear Filters
                      </CButton>
                    )}
                  </div>
                )}
              </div>
            )}
          </CCardBody>
        </CCard>
      </div>
    </div>
  )
}

export default Activity