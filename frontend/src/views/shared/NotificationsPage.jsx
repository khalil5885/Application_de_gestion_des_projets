import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilCheckAlt, cilReload, cilTrash } from '@coreui/icons'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'

const typeMeta = {
  request_approved: { label: 'Request approved', color: 'success' },
  request_rejected: { label: 'Request rejected', color: 'danger' },
  request_created: { label: 'Request created', color: 'info' },
  task_assigned: { label: 'Task assigned', color: 'primary' },
  comment_added: { label: 'Comment added', color: 'secondary' },
}

const filterOptions = {
  admin: [
    ['all', 'All'],
    ['requests', 'Requests'],
    ['comments', 'Comments'],
    ['tasks', 'Tasks'],
    ['projects', 'Projects'],
  ],
  employee: [
    ['all', 'All'],
    ['requests', 'Requests'],
    ['comments', 'Comments'],
    ['tasks', 'Tasks'],
  ],
}

const normalizeList = (response) => {
  const data = response.data?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const prettifyKey = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const renderData = (data = {}) => {
  const priority = ['title', 'project_name', 'task_title', 'comment', 'message', 'requestable_type']
  const rows = priority
    .filter((key) => data[key])
    .map((key) => [prettifyKey(key), data[key]])

  if (rows.length === 0) {
    Object.entries(data).forEach(([key, value]) => {
      if (['feedback', 'reason'].includes(key)) return
      if (value === null || typeof value === 'object') return
      rows.push([prettifyKey(key), value])
    })
  }

  return rows.slice(0, 4)
}

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const data = notification.data || {}
  const meta = typeMeta[notification.type] || {
    label: notification.type ? prettifyKey(notification.type) : 'Notification',
    color: 'secondary',
  }
  const isUnread = !notification.read_at
  const details = renderData(data)
  const feedback = data.feedback || data.reason

  return (
    <CCard className={`shadow-sm ${isUnread ? 'border-start border-primary border-4' : ''}`}>
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div className="d-flex gap-3 flex-grow-1">
            <CIcon icon={cilBell} className="text-body-secondary mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                <CBadge color={meta.color}>{meta.label}</CBadge>
                {isUnread && <CBadge color="primary">New</CBadge>}
              </div>
              {feedback && (
                <div className="bg-body-tertiary rounded p-2 small mb-2">
                  {feedback}
                </div>
              )}
              {details.length > 0 && (
                <CRow className="g-2 small mb-2">
                  {details.map(([label, value]) => (
                    <CCol xs={12} md={6} key={label}>
                      <span className="text-body-secondary">{label}: </span>
                      <span className="fw-semibold">{String(value)}</span>
                    </CCol>
                  ))}
                </CRow>
              )}
              <div className="small text-body-secondary">{formatDate(notification.created_at)}</div>
            </div>
          </div>
          <div className="d-flex gap-2 flex-shrink-0">
            {isUnread && (
              <CButton
                color="primary"
                size="sm"
                variant="outline"
                title="Mark as read"
                onClick={() => onMarkRead(notification.id)}
              >
                <CIcon icon={cilCheckAlt} />
              </CButton>
            )}
            <CButton
              color="danger"
              size="sm"
              variant="outline"
              title="Delete"
              onClick={() => onDelete(notification.id)}
            >
              <CIcon icon={cilTrash} />
            </CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

const NotificationsPage = () => {
  const { user } = useAuth()
  const { refreshCounts } = useNotifications()
  const role = user?.global_role || user?.role
  const [notifications, setNotifications] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const options = filterOptions[role] || []

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = typeFilter !== 'all' ? { type: typeFilter } : {}
      const response = await api.get('/api/notifications', { params })
      setNotifications(normalizeList(response))
      refreshCounts()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [refreshCounts, typeFilter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const markRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`)
    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item,
      ),
    )
    refreshCounts()
  }

  const markAllRead = async () => {
    await api.patch('/api/notifications/read-all')
    setNotifications((items) =>
      items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    )
    refreshCounts()
  }

  const deleteNotification = async (id) => {
    await api.delete(`/api/notifications/${id}`)
    setNotifications((items) => items.filter((item) => item.id !== id))
    refreshCounts()
  }

  return (
    <div className="pb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Notifications
            <CBadge color="primary" className="ms-2">{unreadCount} unread</CBadge>
          </h4>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {options.length > 0 && (
            <CFormSelect
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              style={{ width: 180 }}
            >
              {options.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </CFormSelect>
          )}
          {unreadCount > 0 && (
            <CButton color="secondary" variant="outline" onClick={markAllRead}>
              Mark all read
            </CButton>
          )}
          <CButton color="primary" variant="outline" onClick={fetchNotifications} disabled={loading}>
            <CIcon icon={cilReload} className="me-2" />
            Refresh
          </CButton>
        </div>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}

      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : notifications.length === 0 ? (
        <CCard className="shadow-sm">
          <CCardBody className="text-center py-5 text-body-secondary">
            No notifications found.
          </CCardBody>
        </CCard>
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={markRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
