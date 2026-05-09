import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CAlert, CBadge, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilReload } from '@coreui/icons'
import api from '../../api'

const TYPE_COLORS = {
  delay: 'danger',
  comment: 'info',
  approval: 'success',
  milestone: 'primary',
  update: 'secondary',
}

const normalizeList = (response) => {
  const data = response.data?.data || response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ClientNotifications = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/notifications')
      setItems(normalizeList(response))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(fetchNotifications, 0)
    return () => window.clearTimeout(timer)
  }, [fetchNotifications])

  const grouped = useMemo(() => items, [items])

  return (
    <div className="pb-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Notifications</h4>
          <p className="text-body-secondary mb-0">
            Project updates, approvals, comments, and delay notices.
          </p>
        </div>
        <CButton color="primary" variant="outline" onClick={fetchNotifications} disabled={loading}>
          <CIcon icon={cilReload} className="me-2" />
          Refresh
        </CButton>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : grouped.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5 text-body-secondary">
            <CIcon icon={cilBell} size="xl" className="mb-3 opacity-25" />
            <div>No notifications yet.</div>
          </CCardBody>
        </CCard>
      ) : (
        <div className="d-flex flex-column gap-3">
          {grouped.map((item, index) => {
            const type = item.type || item.category || 'update'
            return (
              <CCard key={item.id || index} className="border-0 shadow-sm">
                <CCardBody className="d-flex gap-3">
                  <div
                    className={`rounded-circle bg-${TYPE_COLORS[type] || 'secondary'} bg-opacity-25`}
                    style={{ width: 12, height: 12, marginTop: 6, flexShrink: 0 }}
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
                      <div className="fw-semibold">
                        {item.title || item.message || 'Project update'}
                      </div>
                      <CBadge color={TYPE_COLORS[type] || 'secondary'}>
                        {type.replaceAll('_', ' ')}
                      </CBadge>
                    </div>
                    {item.description && (
                      <p className="small text-body-secondary mb-1">{item.description}</p>
                    )}
                    <div className="small text-body-secondary">
                      {formatDate(item.created_at || item.date)}
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClientNotifications
