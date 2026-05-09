import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilFilter, cilReload, cilTrash } from '@coreui/icons'
import api from '../../api'

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  request_created:  { label: 'Request Submitted', color: 'info' },
  request_approved: { label: 'Request Approved',  color: 'success' },
  request_rejected: { label: 'Request Rejected',  color: 'danger' },
  task_assigned:    { label: 'Task Assigned',      color: 'primary' },
  task_deadline_extended: { label: 'Deadline Extended', color: 'warning' },
}

const REQUEST_TYPES = ['request_created', 'request_approved', 'request_rejected']

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const normalizeList = (response) => {
  const data = response.data?.data
  if (Array.isArray(data))       return { items: data,       meta: null }
  if (Array.isArray(data?.data)) return { items: data.data,  meta: data }
  return { items: [], meta: null }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const RequestNotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const { data, type, read_at, created_at } = notification
  const isRequest = REQUEST_TYPES.includes(type)
  const meta = TYPE_LABELS[type] || { label: type, color: 'secondary' }
  const isUnread = !read_at

  return (
    <CCard
      className={`border-0 shadow-sm ${isUnread ? 'border-start border-3 border-primary' : ''}`}
    >
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start gap-3">

          {/* Left: icon + content */}
          <div className="d-flex gap-3 flex-grow-1">
            <div className="mt-1">
              <CIcon icon={cilBell} className="text-body-secondary" />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <CBadge color={meta.color}>{meta.label}</CBadge>
                {isUnread && <CBadge color="primary" shape="rounded-pill">New</CBadge>}
              </div>

              {/* Request-specific details */}
              {isRequest && (
                <div className="small mb-2">
                  <span className="text-body-secondary">Request #{data?.request_id}</span>
                  {data?.requestable_type && (
                    <span className="text-body-secondary ms-2">
                      · {data.requestable_type} #{data.requestable_id}
                    </span>
                  )}
                </div>
              )}

              {/* Admin feedback on approve/reject */}
              {(type === 'request_approved' || type === 'request_rejected') && (
                <div className="rounded-3 p-2 bg-body-tertiary small mb-2">
                  <span className="fw-semibold">Admin feedback: </span>
                  {data?.feedback || 'No feedback provided.'}
                </div>
              )}

              <div className="small text-body-secondary">{formatDate(created_at)}</div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="d-flex gap-2 flex-shrink-0">
            {isUnread && (
              <CButton
                size="sm"
                color="primary"
                variant="ghost"
                onClick={() => onMarkRead(notification.id)}
                title="Mark as read"
              >
                ✓
              </CButton>
            )}
            <CButton
              size="sm"
              color="danger"
              variant="ghost"
              onClick={() => onDelete(notification.id)}
              title="Delete"
            >
              <CIcon icon={cilTrash} size="sm" />
            </CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [typeFilter, setTypeFilter]       = useState('all')   // all | requests | tasks | ...

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = typeFilter !== 'all' ? { type: typeFilter } : {}
      const response = await api.get('/api/notifications', { params })
      setNotifications(normalizeList(response).items)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleMarkRead = useCallback(async (id) => {
    await api.patch(`/api/notifications/${id}/read`)
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    )
  }, [])

  const handleDelete = useCallback(async (id) => {
    await api.delete(`/api/notifications/${id}`)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    await api.patch('/api/notifications/read-all')
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  )

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Notifications
            {unreadCount > 0 && (
              <CBadge color="primary" className="ms-2">{unreadCount} new</CBadge>
            )}
          </h4>
          <p className="text-body-secondary mb-0">
            Your activity feed — including request responses from admins.
          </p>
        </div>
        <div className="d-flex gap-2">
          {unreadCount > 0 && (
            <CButton color="secondary" variant="outline" onClick={handleMarkAllRead}>
              Mark all read
            </CButton>
          )}
          <CButton color="primary" variant="outline" onClick={fetchNotifications} disabled={loading}>
            <CIcon icon={cilReload} className="me-2" />
            Refresh
          </CButton>
        </div>
      </div>

      {/* Filter bar */}
      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <CInputGroup style={{ maxWidth: 240 }}>
            <CInputGroupText>
              <CIcon icon={cilFilter} size="sm" />
            </CInputGroupText>
            <CFormSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All notifications</option>
              <option value="requests">Requests only</option>
              <option value="tasks">Tasks only</option>
            </CFormSelect>
          </CInputGroup>
        </CCardBody>
      </CCard>

      {error && <CAlert color="danger">{error}</CAlert>}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="small text-body-secondary mt-2">Loading notifications...</div>
        </div>
      ) : notifications.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5 text-body-secondary">
            No notifications found.
          </CCardBody>
        </CCard>
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((notification) => (
            <RequestNotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage