import React, { useEffect, useState } from 'react'
import { CCard, CCardBody, CBadge, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilHistory, 
  cilUser, 
  cilBriefcase, 
  cilTask, 
  cilTrash, 
  cilPlus, 
  cilPencil // Added missing import
} from '@coreui/icons'
import { motion } from 'motion/react'
import api from '../../../api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getEventConfig = (event, subjectType) => {
  // Extract class name if it's a full PHP namespace
  const type = subjectType?.split('\\').pop()

  if (event === 'created' && type === 'Project') return { label: 'created project', color: '#22c55e', icon: cilPlus }
  if (event === 'created' && type === 'Task')    return { label: 'created task',    color: '#3b82f6', icon: cilTask }
  if (event === 'created' && type === 'User')    return { label: 'added user',      color: '#9333ea', icon: cilUser }
  if (event === 'updated' && type === 'Project') return { label: 'updated project', color: '#f59e0b', icon: cilPencil }
  if (event === 'updated' && type === 'Task')    return { label: 'updated task',    color: '#f59e0b', icon: cilPencil }
  if (event === 'deleted' && type === 'Project') return { label: 'deleted project', color: '#e55353', icon: cilTrash }
  if (event === 'deleted' && type === 'Task')    return { label: 'deleted task',    color: '#e55353', icon: cilTrash }
  
  return { label: event, color: '#6b7280', icon: cilHistory }
}

const getSubjectName = (log) => {
  const type = log.subject_type?.split('\\').pop()
  const name = log.properties?.attributes?.name
    || log.properties?.attributes?.title
    || `#${log.subject_id}`

  return { type, name }
}

const formatTime = (dateStr) => {
  if (!dateStr) return '...'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)} days ago`
}

// ─── Component ────────────────────────────────────────────────────────────────

const Activity = () => {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/api/admin/activity-logs')
      .then(res => {
        // Adjusted to handle both flat arrays and paginated Laravel responses
        const data = res.data.data?.data || res.data.data || []
        setLogs(data)
      })
      .catch(() => setError('Failed to load activity logs.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-5">
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

      <div style={{ maxWidth: 640 }}>
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>Recent Activity</span>
              {!loading && <CBadge color="secondary" shape="rounded-pill">{logs.length} events</CBadge>}
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
                {logs.length > 0 && (
                  <div style={{
                    position: 'absolute', left: 19, top: 0, bottom: 0,
                    width: 2, background: 'var(--cui-border-color-translucent)',
                  }} />
                )}

                <div className="d-flex flex-column gap-4">
                  {logs.map((log, idx) => {
                    const config = getEventConfig(log.event, log.subject_type)
                    const { type, name } = getSubjectName(log)
                    const actor = log.causer?.name ?? 'System'

                    return (
                      <motion.div
                        key={log.id || idx}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                      >
                        {/* Icon Node */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                          background: `${config.color}18`,
                          border: `1.5px solid ${config.color}40`,
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
                          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                            <span className="fw-bold">{actor}</span>
                            {' '}
                            <span className="text-body-secondary">{config.label}</span>
                            {' '}
                            <span style={{ 
                              background: `${config.color}15`, 
                              color: config.color, 
                              borderRadius: 6, 
                              padding: '2px 8px', 
                              fontWeight: 600, 
                              fontSize: '11px',
                              display: 'inline-block'
                            }}>
                              {type}: {name}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--cui-secondary-color)', marginTop: 6 }}>
                            <CIcon icon={cilHistory} size="custom-size" height={10} className="me-1" />
                            {formatTime(log.created_at)}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {logs.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-body-secondary small mb-0">No activity recorded yet.</p>
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