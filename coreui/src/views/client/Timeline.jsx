import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CAlert, CBadge, CCard, CCardBody, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilCheckCircle, cilClock } from '@coreui/icons'
import api from '../../api'

const normalizeList = (response) => {
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const statusColor = (status) => {
  if (status === 'done') return 'success'
  if (status === 'on_hold') return 'danger'
  if (status === 'in_progress') return 'primary'
  if (status === 'ready_for_review') return 'info'
  return 'warning'
}

const ClientTimeline = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTimeline = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/client/activity')
      setItems(normalizeList(response))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timeline.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(fetchTimeline, 0)
    return () => window.clearTimeout(timer)
  }, [fetchTimeline])

  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) => new Date(a.date || a.due_date) - new Date(b.date || b.due_date),
    )
  }, [items])

  return (
    <div className="pb-5">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Timeline</h4>
        <p className="text-body-secondary mb-0">
          Milestones, deadlines, review dates, and completed phases.
        </p>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : sorted.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center text-body-secondary py-5">
            <CIcon icon={cilCalendar} size="xl" className="mb-3 opacity-25" />
            <div>No timeline items yet.</div>
          </CCardBody>
        </CCard>
      ) : (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <div className="d-flex flex-column gap-4">
              {sorted.map((item, index) => {
                const status = item.status || (item.completed_at ? 'done' : 'todo')
                return (
                  <div key={item.id || index} className="d-flex gap-3">
                    <div className="d-flex flex-column align-items-center" style={{ width: 28 }}>
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center bg-${statusColor(status)} bg-opacity-10`}
                        style={{ width: 28, height: 28 }}
                      >
                        <CIcon
                          icon={status === 'done' ? cilCheckCircle : cilClock}
                          className={`text-${statusColor(status)}`}
                        />
                      </div>
                      {index < sorted.length - 1 && <div className="vr flex-grow-1 mt-2" />}
                    </div>
                    <div className="flex-grow-1 rounded-3 p-3 bg-body-tertiary">
                      <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
                        <div className="fw-semibold">
                          {item.title || item.name || 'Timeline item'}
                        </div>
                        <CBadge color={statusColor(status)}>{status.replaceAll('_', ' ')}</CBadge>
                      </div>
                      <div className="small text-body-secondary mb-2">
                        {formatDate(item.date || item.due_date)}
                      </div>
                      {item.description && <div className="small">{item.description}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CCardBody>
        </CCard>
      )}
    </div>
  )
}

export default ClientTimeline
